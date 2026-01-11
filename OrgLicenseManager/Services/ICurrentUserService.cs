using OrgLicenseManager.Entities;

namespace OrgLicenseManager.Services;

public interface ICurrentUserService
{
    string ExternalId { get; }
    string Email { get; }
    string Role { get; }
    bool IsAdmin { get; }
    Task<User> GetUserAsync();
}
