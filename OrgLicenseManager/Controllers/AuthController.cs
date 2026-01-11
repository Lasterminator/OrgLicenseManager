using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using OrgLicenseManager.Contracts.Auth.Requests;
using OrgLicenseManager.Contracts.Auth.Responses;
using OrgLicenseManager.Exceptions;
using OrgLicenseManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace OrgLicenseManager.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IConfiguration configuration, IUserService userService) : ControllerBase
{
    private readonly IConfiguration _configuration = configuration;
    private readonly IUserService _userService = userService;

    [HttpPost("login")]
    public async Task<IResult> Login([FromBody] LoginRequest request)
    {
        if (!new EmailAddressAttribute().IsValid(request.Email))
        {
            throw new BadRequestException("Invalid email format", "The email address provided is not in a valid format");
        }

        var validRoles = new[] { "User", "Admin" };
        if (!validRoles.Contains(request.Role, StringComparer.OrdinalIgnoreCase))
        {
            throw new BadRequestException("Invalid role", "Role must be either 'User' or 'Admin'");
        }

        // Create or update user in database on login
        await _userService.GetOrCreateAsync(request.UserId, request.Email, request.Role);

        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var issuer = jwtSettings["Issuer"];
        var audience = jwtSettings["Audience"];
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

        var claims = new List<Claim>
        {
            new("role", request.Role),
            new(JwtRegisteredClaimNames.Sub, request.UserId),
            new(JwtRegisteredClaimNames.Email, request.Email),
            new (JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new (JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenString = tokenHandler.WriteToken(token);

        return Results.Ok(new LoginResponse(
            Token: tokenString,
            ExpiresAt: token.ValidTo,
            UserId: request.UserId,
            Email: request.Email,
            Role: request.Role
        ));
    }

    [HttpGet("claims")]
    [Authorize]
    public IResult GetClaims()
    {
        var user = HttpContext.User;

        return Results.Ok(new ClaimsResponse(
            UserId: user.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Email: user.FindFirst(ClaimTypes.Email)?.Value,
            Role: user.FindFirst(ClaimTypes.Role)?.Value,
            AllClaims: user.Claims.Select(c => new ClaimItem(c.Type, c.Value)).ToList()
        ));
    }
}
