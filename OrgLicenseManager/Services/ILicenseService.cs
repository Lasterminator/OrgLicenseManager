using OrgLicenseManager.Contracts.Common;
using OrgLicenseManager.Entities;

namespace OrgLicenseManager.Services;

public interface ILicenseService
{
    Task<License> CreateAsync(Guid organizationId, bool autoRenewal);
    Task<PagedResult<License>> GetAllPagedAsync(PaginationRequest pagination);
    Task<License?> GetByIdAsync(Guid licenseId);
    Task<License> UpdateAsync(Guid licenseId, DateTime? expiresAt, bool? autoRenewal);
    Task CancelAsync(Guid licenseId);
    Task RenewExpiredLicensesAsync();
}
