using OrgLicenseManager.Entities;

namespace OrgLicenseManager.Services;

public interface IUserService
{
    Task<User> GetOrCreateAsync(string externalId, string email, string role);
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByExternalIdAsync(string externalId);
}
