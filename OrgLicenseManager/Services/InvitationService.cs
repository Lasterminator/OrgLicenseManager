using System.Linq.Expressions;
using System.Security.Cryptography;
using OrgLicenseManager.Contracts.Common;
using OrgLicenseManager.Data;
using OrgLicenseManager.Entities;
using OrgLicenseManager.Exceptions;
using OrgLicenseManager.Extensions;
using Microsoft.EntityFrameworkCore;

namespace OrgLicenseManager.Services;

public class InvitationService : IInvitationService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private const int InvitationExpirationDays = 7;

    public InvitationService(ApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<Invitation> CreateAsync(Guid organizationId, string email, OrganizationRole role, User invitedByUser)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .Include(o => o.Invitations)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        var membership = organization.Memberships.FirstOrDefault(m => m.UserId == invitedByUser.Id);
        if (membership == null || membership.Role < OrganizationRole.Admin)
        {
            throw new ForbiddenException("Insufficient permissions", "You must be an Owner or Admin to invite users");
        }

        if (role == OrganizationRole.Owner && membership.Role != OrganizationRole.Owner)
        {
            throw new ForbiddenException("Cannot invite as owner", "Only owners can invite new owners");
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();

        var existingMember = await _context.OrganizationMemberships
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.User.Email.ToLower() == normalizedEmail);

        if (existingMember != null)
        {
            throw new BadRequestException("Already a member", "This user is already a member of the organization");
        }

        var existingInvitation = organization.Invitations
            .FirstOrDefault(i => i.Email.ToLower() == normalizedEmail);

        if (existingInvitation != null)
        {
            throw new BadRequestException("Invitation exists", "An invitation has already been sent to this email");
        }

        var invitation = new Invitation
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Email = normalizedEmail,
            Token = GenerateToken(),
            Role = role,
            ExpiresAt = DateTime.UtcNow.AddDays(InvitationExpirationDays),
            InvitedByUserId = invitedByUser.Id,
            CreatedAt = DateTime.UtcNow
        };

        _context.Invitations.Add(invitation);
        await _context.SaveChangesAsync();

        await _emailService.SendInvitationEmailAsync(normalizedEmail, organization.Name, invitation.Token);

        invitation.Organization = organization;
        return invitation;
    }

    public async Task<PagedResult<Invitation>> GetAllForOrganizationPagedAsync(Guid organizationId, User currentUser, PaginationRequest pagination)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        var membership = organization.Memberships.FirstOrDefault(m => m.UserId == currentUser.Id);
        if (membership == null || membership.Role < OrganizationRole.Admin)
        {
            throw new ForbiddenException("Insufficient permissions", "You must be an Owner or Admin to view invitations");
        }

        var sortMappings = new Dictionary<string, Expression<Func<Invitation, object>>>
        {
            ["email"] = i => i.Email,
            ["role"] = i => i.Role,
            ["createdat"] = i => i.CreatedAt,
            ["expiresat"] = i => i.ExpiresAt
        };

        var query = _context.Invitations
            .Include(i => i.Organization)
            .Where(i => i.OrganizationId == organizationId);

        if (!string.IsNullOrWhiteSpace(pagination.Search))
        {
            var search = pagination.Search.ToLower();
            query = query.Where(i => i.Email.ToLower().Contains(search));
        }

        query = query.ApplySort(pagination.SortBy, pagination.SortDescending, sortMappings, i => i.CreatedAt);

        return await query.ToPagedResultAsync(pagination);
    }

    public async Task<Invitation> GetByIdAsync(Guid organizationId, Guid invitationId, User currentUser)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        var membership = organization.Memberships.FirstOrDefault(m => m.UserId == currentUser.Id);
        if (membership == null || membership.Role < OrganizationRole.Admin)
        {
            throw new ForbiddenException("Insufficient permissions", "You must be an Owner or Admin to view invitations");
        }

        var invitation = await _context.Invitations
            .Include(i => i.Organization)
            .FirstOrDefaultAsync(i => i.Id == invitationId && i.OrganizationId == organizationId);

        if (invitation == null)
        {
            throw new NotFoundException("Invitation not found", $"Invitation with ID {invitationId} does not exist");
        }

        return invitation;
    }

    public async Task CancelAsync(Guid organizationId, Guid invitationId, User currentUser)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        var membership = organization.Memberships.FirstOrDefault(m => m.UserId == currentUser.Id);
        if (membership == null || membership.Role < OrganizationRole.Admin)
        {
            throw new ForbiddenException("Insufficient permissions", "You must be an Owner or Admin to cancel invitations");
        }

        var invitation = await _context.Invitations
            .FirstOrDefaultAsync(i => i.Id == invitationId && i.OrganizationId == organizationId);

        if (invitation == null)
        {
            throw new NotFoundException("Invitation not found", $"Invitation with ID {invitationId} does not exist");
        }

        _context.Invitations.Remove(invitation);
        await _context.SaveChangesAsync();
    }

    public async Task<OrganizationMembership> AcceptAsync(string token, User user)
    {
        var invitation = await _context.Invitations
            .Include(i => i.Organization)
            .FirstOrDefaultAsync(i => i.Token == token);

        if (invitation == null)
        {
            throw new NotFoundException("Invitation not found", "Invalid or expired invitation token");
        }

        if (invitation.ExpiresAt <= DateTime.UtcNow)
        {
            _context.Invitations.Remove(invitation);
            await _context.SaveChangesAsync();
            throw new BadRequestException("Invitation expired", "This invitation has expired");
        }

        if (!invitation.Email.Equals(user.Email, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenException("Email mismatch", "This invitation was sent to a different email address");
        }

        var existingMembership = await _context.OrganizationMemberships
            .FirstOrDefaultAsync(m => m.OrganizationId == invitation.OrganizationId && m.UserId == user.Id);

        if (existingMembership != null)
        {
            _context.Invitations.Remove(invitation);
            await _context.SaveChangesAsync();
            throw new BadRequestException("Already a member", "You are already a member of this organization");
        }

        var membership = new OrganizationMembership
        {
            Id = Guid.NewGuid(),
            OrganizationId = invitation.OrganizationId,
            UserId = user.Id,
            Role = invitation.Role,
            JoinedAt = DateTime.UtcNow
        };

        _context.OrganizationMemberships.Add(membership);
        _context.Invitations.Remove(invitation);
        await _context.SaveChangesAsync();

        membership.Organization = invitation.Organization;
        membership.User = user;

        return membership;
    }

    private static string GenerateToken()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}
