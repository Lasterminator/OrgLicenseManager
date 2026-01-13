using OrgLicenseManager.Entities;

namespace OrgLicenseManager.Services;

public interface IMembershipService
{
    Task<List<OrganizationMembership>> GetMyOrganizationsAsync(User user);
    Task<OrganizationMembership> GetMyOrganizationAsync(Guid organizationId, User user);
    Task LeaveOrganizationAsync(Guid organizationId, User user);
}
