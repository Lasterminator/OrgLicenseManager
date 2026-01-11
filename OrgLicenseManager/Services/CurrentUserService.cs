using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using OrgLicenseManager.Entities;
using OrgLicenseManager.Exceptions;

namespace OrgLicenseManager.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserService _userService;
    private User? _cachedUser;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor, IUserService userService)
    {
        _httpContextAccessor = httpContextAccessor;
        _userService = userService;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string ExternalId => User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
        ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedException("Not authenticated", "User is not authenticated");

    public string Email => User?.FindFirst(JwtRegisteredClaimNames.Email)?.Value
        ?? User?.FindFirst(ClaimTypes.Email)?.Value
        ?? throw new UnauthorizedException("Email not found", "Email claim not found in token");

    public string Role => User?.FindFirst("role")?.Value
        ?? User?.FindFirst(ClaimTypes.Role)?.Value
        ?? "User";

    public bool IsAdmin => Role.Equals("Admin", StringComparison.OrdinalIgnoreCase);

    public async Task<User> GetUserAsync()
    {
        if (_cachedUser != null)
            return _cachedUser;

        _cachedUser = await _userService.GetOrCreateAsync(ExternalId, Email, Role);
        return _cachedUser;
    }
}
