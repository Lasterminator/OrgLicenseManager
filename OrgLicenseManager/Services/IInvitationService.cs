using OrgLicenseManager.Contracts.Common;
using OrgLicenseManager.Entities;

namespace OrgLicenseManager.Services;

public interface IInvitationService
{
    Task<Invitation> CreateAsync(Guid organizationId, string email, OrganizationRole role, User invitedByUser);
    Task<PagedResult<Invitation>> GetAllForOrganizationPagedAsync(Guid organizationId, User currentUser, PaginationRequest pagination);
    Task<Invitation> GetByIdAsync(Guid organizationId, Guid invitationId, User currentUser);
    Task CancelAsync(Guid organizationId, Guid invitationId, User currentUser);
    Task<OrganizationMembership> AcceptAsync(string token, User user);
}
