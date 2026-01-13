using OrgLicenseManager.Contracts.Invitations.Requests;
using OrgLicenseManager.Contracts.Organizations.Responses;
using OrgLicenseManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace OrgLicenseManager.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MembershipsController : ControllerBase
{
    private readonly IMembershipService _membershipService;
    private readonly IInvitationService _invitationService;
    private readonly ICurrentUserService _currentUserService;

    public MembershipsController(
        IMembershipService membershipService,
        IInvitationService invitationService,
        ICurrentUserService currentUserService)
    {
        _membershipService = membershipService;
        _invitationService = invitationService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IResult> GetAllUserOrganizations()
    {
        var user = await _currentUserService.GetUserAsync();
        var memberships = await _membershipService.GetMyOrganizationsAsync(user);

        var response = memberships.Select(m => new UserOrganizationResponse(
            Id: m.Organization.Id,
            Name: m.Organization.Name,
            Description: m.Organization.Description,
            Role: m.Role.ToString(),
            JoinedAt: m.JoinedAt)).ToList();

        return Results.Ok(response);
    }

    [HttpGet("{organizationId}")]
    public async Task<IResult> GetUserOrganization(Guid organizationId)
    {
        var user = await _currentUserService.GetUserAsync();
        var membership = await _membershipService.GetMyOrganizationAsync(organizationId, user);

        var response = new UserOrganizationResponse(
            Id: membership.Organization.Id,
            Name: membership.Organization.Name,
            Description: membership.Organization.Description,
            Role: membership.Role.ToString(),
            JoinedAt: membership.JoinedAt);

        return Results.Ok(response);
    }

    [HttpDelete("{organizationId}")]
    public async Task<IResult> LeaveOrganization(Guid organizationId)
    {
        var user = await _currentUserService.GetUserAsync();
        await _membershipService.LeaveOrganizationAsync(organizationId, user);
        return Results.NoContent();
    }

    [HttpPost("invitations/accept")]
    public async Task<IResult> AcceptInvitation([FromBody] AcceptInvitationRequest request)
    {
        var user = await _currentUserService.GetUserAsync();
        var membership = await _invitationService.AcceptAsync(request.Token, user);

        var response = new UserOrganizationResponse(
            Id: membership.Organization.Id,
            Name: membership.Organization.Name,
            Description: membership.Organization.Description,
            Role: membership.Role.ToString(),
            JoinedAt: membership.JoinedAt);

        return Results.Created($"/api/memberships/{membership.OrganizationId}", response);
    }

    [HttpGet("invitations/accept")]
    [AllowAnonymous]
    public async Task<IResult> AcceptInvitationViaLink([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Results.Content(BuildErrorHtml("Invalid Request", "No invitation token provided."), "text/html");
        }

        try
        {
            var user = await _currentUserService.GetUserAsync();
            var membership = await _invitationService.AcceptAsync(token, user);

            return Results.Content(
                BuildSuccessHtml(membership.Organization.Name, membership.Role.ToString()),
                "text/html");
        }
        catch (Exceptions.UnauthorizedException)
        {
            return Results.Content(BuildLoginRequiredHtml(token), "text/html");
        }
        catch (Exceptions.NotFoundException ex)
        {
            return Results.Content(BuildErrorHtml("Invitation Not Found", ex.Detail ?? "This invitation is invalid or has already been used."), "text/html");
        }
        catch (Exceptions.BadRequestException ex)
        {
            return Results.Content(BuildErrorHtml("Cannot Accept Invitation", ex.Detail ?? "Unable to accept this invitation."), "text/html");
        }
        catch (Exceptions.ForbiddenException ex)
        {
            return Results.Content(BuildErrorHtml("Access Denied", ex.Detail ?? "You don't have permission to accept this invitation."), "text/html");
        }
    }

    private static string BuildSuccessHtml(string organizationName, string role)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <title>Invitation Accepted</title>
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px; }}
        .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }}
        .success-icon {{ font-size: 60px; color: #4CAF50; }}
        h1 {{ color: #333; margin-top: 20px; }}
        p {{ color: #666; font-size: 16px; }}
        .org-name {{ color: #4A90D9; font-weight: bold; }}
        .role {{ background: #e3f2fd; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-top: 10px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='success-icon'>✓</div>
        <h1>Welcome!</h1>
        <p>You have successfully joined <span class='org-name'>{organizationName}</span></p>
        <p class='role'>Role: {role}</p>
        <p style='margin-top: 30px; font-size: 14px; color: #888;'>You can now close this page.</p>
    </div>
</body>
</html>";
    }

    private static string BuildLoginRequiredHtml(string token)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <title>Login Required</title>
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px; }}
        .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }}
        .icon {{ font-size: 60px; color: #FF9800; }}
        h1 {{ color: #333; margin-top: 20px; }}
        p {{ color: #666; font-size: 16px; }}
        .token-box {{ background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 12px; }}
        code {{ background: #e8e8e8; padding: 2px 6px; border-radius: 3px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='icon'>🔐</div>
        <h1>Login Required</h1>
        <p>To accept this invitation, you need to be logged in.</p>
        <p style='font-size: 14px; color: #888;'>Please log in via the API and then call:</p>
        <p><code>POST /api/memberships/invitations/accept</code></p>
        <p style='font-size: 14px;'>With your token:</p>
        <div class='token-box'>{token}</div>
    </div>
</body>
</html>";
    }

    private static string BuildErrorHtml(string title, string message)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <title>{title}</title>
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px; }}
        .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }}
        .error-icon {{ font-size: 60px; color: #f44336; }}
        h1 {{ color: #333; margin-top: 20px; }}
        p {{ color: #666; font-size: 16px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='error-icon'>✗</div>
        <h1>{title}</h1>
        <p>{message}</p>
    </div>
</body>
</html>";
    }
}
