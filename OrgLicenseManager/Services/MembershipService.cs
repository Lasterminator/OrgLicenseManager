using OrgLicenseManager.Data;
using OrgLicenseManager.Entities;
using OrgLicenseManager.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace OrgLicenseManager.Services;

public class MembershipService : IMembershipService
{
    private readonly ApplicationDbContext _context;

    public MembershipService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrganizationMembership>> GetMyOrganizationsAsync(User user)
    {
        return await _context.OrganizationMemberships
            .Include(m => m.Organization)
            .Where(m => m.UserId == user.Id)
            .OrderByDescending(m => m.JoinedAt)
            .ToListAsync();
    }

    public async Task<OrganizationMembership> GetMyOrganizationAsync(Guid organizationId, User user)
    {
        var membership = await _context.OrganizationMemberships
            .Include(m => m.Organization)
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == user.Id);

        if (membership == null)
        {
            throw new NotFoundException("Membership not found", "You are not a member of this organization");
        }

        return membership;
    }

    public async Task LeaveOrganizationAsync(Guid organizationId, User user)
    {
        var membership = await _context.OrganizationMemberships
            .Include(m => m.Organization)
            .ThenInclude(o => o.Memberships)
            .Include(m => m.AssignedLicense)
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == user.Id);

        if (membership == null)
        {
            throw new NotFoundException("Membership not found", "You are not a member of this organization");
        }

        if (membership.Role == OrganizationRole.Owner)
        {
            var ownerCount = membership.Organization.Memberships.Count(m => m.Role == OrganizationRole.Owner);
            if (ownerCount <= 1)
            {
                throw new BadRequestException("Cannot leave", "You are the only owner. Transfer ownership before leaving.");
            }
        }

        // Unassign license before leaving
        if (membership.AssignedLicense != null)
        {
            membership.AssignedLicense.AssignedToUserId = null;
            membership.AssignedLicense.UpdatedAt = DateTime.UtcNow;
        }

        _context.OrganizationMemberships.Remove(membership);
        await _context.SaveChangesAsync();
    }
}
