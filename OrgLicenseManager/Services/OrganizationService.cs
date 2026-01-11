using System.Linq.Expressions;
using OrgLicenseManager.Contracts.Common;
using OrgLicenseManager.Data;
using OrgLicenseManager.Entities;
using OrgLicenseManager.Exceptions;
using OrgLicenseManager.Extensions;
using Microsoft.EntityFrameworkCore;

namespace OrgLicenseManager.Services;

public class OrganizationService : IOrganizationService
{
    private readonly ApplicationDbContext _context;

    public OrganizationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Organization> CreateAsync(string name, string? description, User creator)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new BadRequestException("Invalid name", "Organization name is required");
        }

        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Description = description?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Organizations.Add(organization);

        var membership = new OrganizationMembership
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            UserId = creator.Id,
            Role = OrganizationRole.Owner,
            JoinedAt = DateTime.UtcNow
        };

        _context.OrganizationMemberships.Add(membership);
        await _context.SaveChangesAsync();

        return organization;
    }

    public async Task<Organization> UpdateAsync(Guid organizationId, string name, string? description, User currentUser)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        await RequireOwnerOrAdminAsync(organization, currentUser);

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new BadRequestException("Invalid name", "Organization name is required");
        }

        organization.Name = name.Trim();
        organization.Description = description?.Trim();
        organization.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return organization;
    }

    public async Task DeleteAsync(Guid organizationId, User currentUser)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        await RequireOwnerOrAdminAsync(organization, currentUser);

        _context.Organizations.Remove(organization);
        await _context.SaveChangesAsync();
    }

    public async Task<Organization?> GetByIdAsync(Guid organizationId)
    {
        return await _context.Organizations
            .Include(o => o.Memberships)
            .FirstOrDefaultAsync(o => o.Id == organizationId);
    }

    public async Task<Organization> GetByIdForMemberAsync(Guid organizationId, User currentUser)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        var membership = organization.Memberships.FirstOrDefault(m => m.UserId == currentUser.Id);
        if (membership == null)
        {
            throw new ForbiddenException("Not a member", "You are not a member of this organization");
        }

        return organization;
    }

    public async Task<List<OrganizationMembership>> GetUserOrganizationsAsync(User user)
    {
        return await _context.OrganizationMemberships
            .Include(m => m.Organization)
            .ThenInclude(o => o.Memberships)
            .Where(m => m.UserId == user.Id)
            .OrderByDescending(m => m.JoinedAt)
            .ToListAsync();
    }

    public async Task<PagedResult<OrganizationMembership>> GetMembersPagedAsync(Guid organizationId, User currentUser, PaginationRequest pagination)
    {
        var organization = await GetByIdForMemberAsync(organizationId, currentUser);
        await RequireOwnerOrAdminAsync(organization, currentUser);

        var sortMappings = new Dictionary<string, Expression<Func<OrganizationMembership, object>>>
        {
            ["email"] = m => m.User.Email,
            ["role"] = m => m.Role,
            ["joinedat"] = m => m.JoinedAt
        };

        var query = _context.OrganizationMemberships
            .Include(m => m.User)
            .Include(m => m.AssignedLicense)
            .Where(m => m.OrganizationId == organizationId);

        if (!string.IsNullOrWhiteSpace(pagination.Search))
        {
            var search = pagination.Search.ToLower();
            query = query.Where(m => m.User.Email.ToLower().Contains(search));
        }

        query = query.ApplySort(pagination.SortBy, pagination.SortDescending, sortMappings, m => m.JoinedAt);

        return await query.ToPagedResultAsync(pagination);
    }

    public async Task<OrganizationMembership> GetMemberAsync(Guid organizationId, Guid targetUserId, User currentUser)
    {
        var organization = await GetByIdForMemberAsync(organizationId, currentUser);
        await RequireOwnerOrAdminAsync(organization, currentUser);

        var membership = await _context.OrganizationMemberships
            .Include(m => m.User)
            .Include(m => m.AssignedLicense)
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == targetUserId);

        if (membership == null)
        {
            throw new NotFoundException("Member not found", "The specified user is not a member of this organization");
        }

        return membership;
    }

    public async Task UpdateMemberRoleAsync(Guid organizationId, Guid targetUserId, OrganizationRole newRole, User currentUser)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        await RequireOwnerOrAdminAsync(organization, currentUser);

        var targetMembership = organization.Memberships.FirstOrDefault(m => m.UserId == targetUserId);
        if (targetMembership == null)
        {
            throw new NotFoundException("Member not found", "The specified user is not a member of this organization");
        }

        // Ensure at least one owner remains if demoting an owner
        if (targetMembership.Role == OrganizationRole.Owner && newRole != OrganizationRole.Owner)
        {
            var ownerCount = organization.Memberships.Count(m => m.Role == OrganizationRole.Owner);
            if (ownerCount <= 1)
            {
                throw new BadRequestException("Cannot demote owner", "Organization must have at least one owner");
            }
        }

        targetMembership.Role = newRole;
        await _context.SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(Guid organizationId, Guid targetUserId, User currentUser)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        await RequireOwnerOrAdminAsync(organization, currentUser);

        var targetMembership = await _context.OrganizationMemberships
            .Include(m => m.AssignedLicense)
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == targetUserId);

        if (targetMembership == null)
        {
            throw new NotFoundException("Member not found", "The specified user is not a member of this organization");
        }

        // Ensure at least one owner remains
        if (targetMembership.Role == OrganizationRole.Owner)
        {
            var ownerCount = organization.Memberships.Count(m => m.Role == OrganizationRole.Owner);
            if (ownerCount <= 1)
            {
                throw new BadRequestException("Cannot remove owner", "Organization must have at least one owner. Transfer ownership first.");
            }
        }

        // Unassign license before removing membership
        if (targetMembership.AssignedLicense != null)
        {
            targetMembership.AssignedLicense.AssignedToUserId = null;
            targetMembership.AssignedLicense.UpdatedAt = DateTime.UtcNow;
        }

        _context.OrganizationMemberships.Remove(targetMembership);
        await _context.SaveChangesAsync();
    }

    public async Task AssignLicenseAsync(Guid organizationId, Guid targetUserId, Guid licenseId, User currentUser)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .Include(o => o.Licenses)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        await RequireOwnerOrAdminAsync(organization, currentUser);

        var targetMembership = organization.Memberships.FirstOrDefault(m => m.UserId == targetUserId);
        if (targetMembership == null)
        {
            throw new NotFoundException("Member not found", "The specified user is not a member of this organization");
        }

        var license = organization.Licenses.FirstOrDefault(l => l.Id == licenseId);
        if (license == null)
        {
            throw new NotFoundException("License not found", "The specified license does not belong to this organization");
        }

        if (!license.IsActive)
        {
            throw new BadRequestException("License inactive", "Cannot assign an inactive license");
        }

        if (license.AssignedToUserId != null && license.AssignedToUserId != targetUserId)
        {
            throw new BadRequestException("License already assigned", "This license is already assigned to another user");
        }

        license.AssignedToUserId = targetUserId;
        license.UpdatedAt = DateTime.UtcNow;
        targetMembership.AssignedLicenseId = licenseId;

        await _context.SaveChangesAsync();
    }

    public async Task UnassignLicenseAsync(Guid organizationId, Guid targetUserId, User currentUser)
    {
        var organization = await _context.Organizations
            .Include(o => o.Memberships)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("Organization not found", $"Organization with ID {organizationId} does not exist");
        }

        await RequireOwnerOrAdminAsync(organization, currentUser);

        var targetMembership = await _context.OrganizationMemberships
            .Include(m => m.AssignedLicense)
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == targetUserId);

        if (targetMembership == null)
        {
            throw new NotFoundException("Member not found", "The specified user is not a member of this organization");
        }

        if (targetMembership.AssignedLicense != null)
        {
            targetMembership.AssignedLicense.AssignedToUserId = null;
            targetMembership.AssignedLicense.UpdatedAt = DateTime.UtcNow;
        }

        targetMembership.AssignedLicenseId = null;
        await _context.SaveChangesAsync();
    }

    private async Task RequireOwnerOrAdminAsync(Organization organization, User user)
    {
        var membership = organization.Memberships.FirstOrDefault(m => m.UserId == user.Id);
        if (membership == null)
        {
            throw new ForbiddenException("Not a member", "You are not a member of this organization");
        }

        if (membership.Role < OrganizationRole.Admin)
        {
            throw new ForbiddenException("Insufficient permissions", "You must be an Owner or Admin to perform this action");
        }

        await Task.CompletedTask;
    }

    public async Task<PagedResult<License>> GetLicensesPagedAsync(Guid organizationId, User currentUser, PaginationRequest pagination)
    {
        var organization = await GetByIdForMemberAsync(organizationId, currentUser);
        await RequireOwnerOrAdminAsync(organization, currentUser);

        var sortMappings = new Dictionary<string, Expression<Func<License, object>>>
        {
            ["createdat"] = l => l.CreatedAt,
            ["expiresat"] = l => l.ExpiresAt,
            ["isactive"] = l => l.IsActive,
            ["autorenewal"] = l => l.AutoRenewal
        };

        var query = _context.Licenses
            .Include(l => l.AssignedToUser)
            .Where(l => l.OrganizationId == organizationId);

        if (!string.IsNullOrWhiteSpace(pagination.Search))
        {
            var search = pagination.Search.ToLower();
            query = query.Where(l => l.AssignedToUser != null && l.AssignedToUser.Email.ToLower().Contains(search));
        }

        query = query.ApplySort(pagination.SortBy, pagination.SortDescending, sortMappings, l => l.CreatedAt);

        return await query.ToPagedResultAsync(pagination);
    }
}
