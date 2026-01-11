using OrgLicenseManager.Contracts.Common;
using OrgLicenseManager.Entities;

namespace OrgLicenseManager.Services;

public interface IOrganizationService
{
    Task<Organization> CreateAsync(string name, string? description, User creator);
    Task<Organization> UpdateAsync(Guid organizationId, string name, string? description, User currentUser);
    Task DeleteAsync(Guid organizationId, User currentUser);
    Task<Organization?> GetByIdAsync(Guid organizationId);
    Task<Organization> GetByIdForMemberAsync(Guid organizationId, User currentUser);
    Task<List<OrganizationMembership>> GetUserOrganizationsAsync(User user);
    Task<PagedResult<OrganizationMembership>> GetMembersPagedAsync(Guid organizationId, User currentUser, PaginationRequest pagination);
    Task<OrganizationMembership> GetMemberAsync(Guid organizationId, Guid targetUserId, User currentUser);
    Task UpdateMemberRoleAsync(Guid organizationId, Guid targetUserId, OrganizationRole newRole, User currentUser);
    Task RemoveMemberAsync(Guid organizationId, Guid targetUserId, User currentUser);
    Task AssignLicenseAsync(Guid organizationId, Guid targetUserId, Guid licenseId, User currentUser);
    Task UnassignLicenseAsync(Guid organizationId, Guid targetUserId, User currentUser);
    Task<PagedResult<License>> GetLicensesPagedAsync(Guid organizationId, User currentUser, PaginationRequest pagination);
}
