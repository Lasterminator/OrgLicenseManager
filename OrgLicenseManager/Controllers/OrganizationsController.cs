using OrgLicenseManager.Contracts.Common;
using OrgLicenseManager.Contracts.Invitations.Requests;
using OrgLicenseManager.Contracts.Invitations.Responses;
using OrgLicenseManager.Contracts.Licenses.Requests;
using OrgLicenseManager.Contracts.Licenses.Responses;
using OrgLicenseManager.Contracts.Members.Requests;
using OrgLicenseManager.Contracts.Members.Responses;
using OrgLicenseManager.Contracts.Organizations.Requests;
using OrgLicenseManager.Contracts.Organizations.Responses;
using OrgLicenseManager.Entities;
using OrgLicenseManager.Exceptions;
using OrgLicenseManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace OrgLicenseManager.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationService _organizationService;
    private readonly IInvitationService _invitationService;
    private readonly ICurrentUserService _currentUserService;

    public OrganizationsController(
        IOrganizationService organizationService,
        IInvitationService invitationService,
        ICurrentUserService currentUserService)
    {
        _organizationService = organizationService;
        _invitationService = invitationService;
        _currentUserService = currentUserService;
    }

    [HttpPost]
    public async Task<IResult> CreateOrganization([FromBody] CreateOrganizationRequest request)
    {
        var user = await _currentUserService.GetUserAsync();
        var organization = await _organizationService.CreateAsync(request.Name, request.Description, user);

        var response = new OrganizationResponse(
            Id: organization.Id,
            Name: organization.Name,
            Description: organization.Description,
            CreatedAt: organization.CreatedAt,
            UpdatedAt: organization.UpdatedAt,
            MemberCount: 1);

        return Results.Created($"/api/organizations/{organization.Id}", response);
    }

    [HttpPut("{organizationId}")]
    public async Task<IResult> UpdateOrganization(Guid organizationId, [FromBody] UpdateOrganizationRequest request)
    {
        var user = await _currentUserService.GetUserAsync();
        var organization = await _organizationService.UpdateAsync(organizationId, request.Name, request.Description, user);

        var response = new OrganizationResponse(
            Id: organization.Id,
            Name: organization.Name,
            Description: organization.Description,
            CreatedAt: organization.CreatedAt,
            UpdatedAt: organization.UpdatedAt,
            MemberCount: organization.Memberships.Count);

        return Results.Ok(response);
    }

    [HttpDelete("{organizationId}")]
    public async Task<IResult> DeleteOrganization(Guid organizationId)
    {
        var user = await _currentUserService.GetUserAsync();
        await _organizationService.DeleteAsync(organizationId, user);
        return Results.NoContent();
    }

    [HttpGet("{organizationId}")]
    public async Task<IResult> GetOrganization(Guid organizationId)
    {
        var user = await _currentUserService.GetUserAsync();
        var organization = await _organizationService.GetByIdForMemberAsync(organizationId, user);

        var response = new OrganizationResponse(
            Id: organization.Id,
            Name: organization.Name,
            Description: organization.Description,
            CreatedAt: organization.CreatedAt,
            UpdatedAt: organization.UpdatedAt,
            MemberCount: organization.Memberships.Count);

        return Results.Ok(response);
    }

    [HttpGet]
    public async Task<IResult> GetAllOrganizations()
    {
        var user = await _currentUserService.GetUserAsync();
        var memberships = await _organizationService.GetUserOrganizationsAsync(user);

        var response = memberships.Select(m => new OrganizationResponse(
            Id: m.Organization.Id,
            Name: m.Organization.Name,
            Description: m.Organization.Description,
            CreatedAt: m.Organization.CreatedAt,
            UpdatedAt: m.Organization.UpdatedAt,
            MemberCount: m.Organization.Memberships.Count)).ToList();

        return Results.Ok(response);
    }

    [HttpPost("{organizationId}/invite")]
    public async Task<IResult> InviteUserToOrganization(Guid organizationId, [FromBody] CreateInvitationRequest request)
    {
        var user = await _currentUserService.GetUserAsync();

        if (!Enum.TryParse<OrganizationRole>(request.Role, true, out var role))
        {
            throw new BadRequestException("Invalid role", "Role must be Owner, Admin, or Member");
        }

        var invitation = await _invitationService.CreateAsync(organizationId, request.Email, role, user);

        var response = new InvitationResponse(
            Id: invitation.Id,
            OrganizationId: invitation.OrganizationId,
            OrganizationName: invitation.Organization.Name,
            Email: invitation.Email,
            Role: invitation.Role.ToString(),
            ExpiresAt: invitation.ExpiresAt,
            Token: invitation.Token,
            InvitedByUserId: invitation.InvitedByUserId,
            CreatedAt: invitation.CreatedAt)
            ;

        return Results.Created($"/api/organizations/{organizationId}/invitations/{invitation.Id}", response);
    }

    [HttpGet("{organizationId}/invitations")]
    public async Task<IResult> GetAllInvitations(Guid organizationId, [FromQuery] PaginationRequest pagination)
    {
        var user = await _currentUserService.GetUserAsync();
        var pagedInvitations = await _invitationService.GetAllForOrganizationPagedAsync(organizationId, user, pagination);

        var response = new PagedResult<InvitationResponse>(
            Items: pagedInvitations.Items.Select(i => new InvitationResponse(
                Id: i.Id,
                OrganizationId: i.OrganizationId,
                OrganizationName: i.Organization.Name,
                Email: i.Email,
                Token: i.Token,
                Role: i.Role.ToString(),
                ExpiresAt: i.ExpiresAt,
                InvitedByUserId: i.InvitedByUserId,
                CreatedAt: i.CreatedAt)).ToList(),
            Page: pagedInvitations.Page,
            PageSize: pagedInvitations.PageSize,
            TotalCount: pagedInvitations.TotalCount,
            TotalPages: pagedInvitations.TotalPages,
            HasPreviousPage: pagedInvitations.HasPreviousPage,
            HasNextPage: pagedInvitations.HasNextPage);

        return Results.Ok(response);
    }

    [HttpGet("{organizationId}/invitations/{identifier}")]
    public async Task<IResult> GetInvitation(Guid organizationId, Guid identifier)
    {
        var user = await _currentUserService.GetUserAsync();
        var invitation = await _invitationService.GetByIdAsync(organizationId, identifier, user);

        var response = new InvitationResponse(
            Id: invitation.Id,
            OrganizationId: invitation.OrganizationId,
            OrganizationName: invitation.Organization.Name,
            Email: invitation.Email,
            Token: invitation.Token,
            Role: invitation.Role.ToString(),
            ExpiresAt: invitation.ExpiresAt,
            InvitedByUserId: invitation.InvitedByUserId,
            CreatedAt: invitation.CreatedAt);

        return Results.Ok(response);
    }

    [HttpDelete("{organizationId}/invitations/{identifier}")]
    public async Task<IResult> CancelInvitation(Guid organizationId, Guid identifier)
    {
        var user = await _currentUserService.GetUserAsync();
        await _invitationService.CancelAsync(organizationId, identifier, user);
        return Results.NoContent();
    }

    [HttpGet("{organizationId}/users")]
    public async Task<IResult> GetAllUsers(Guid organizationId, [FromQuery] PaginationRequest pagination)
    {
        var user = await _currentUserService.GetUserAsync();
        var pagedMembers = await _organizationService.GetMembersPagedAsync(organizationId, user, pagination);

        var response = new PagedResult<MemberResponse>(
            Items: pagedMembers.Items.Select(m => new MemberResponse(
                UserId: m.UserId,
                Email: m.User.Email,
                Role: m.Role.ToString(),
                JoinedAt: m.JoinedAt,
                License: m.AssignedLicense != null ? new LicenseInfo(
                    Id: m.AssignedLicense.Id,
                    ExpiresAt: m.AssignedLicense.ExpiresAt,
                    IsExpired: m.AssignedLicense.ExpiresAt <= DateTime.UtcNow,
                    AutoRenewal: m.AssignedLicense.AutoRenewal) : null)).ToList(),
            Page: pagedMembers.Page,
            PageSize: pagedMembers.PageSize,
            TotalCount: pagedMembers.TotalCount,
            TotalPages: pagedMembers.TotalPages,
            HasPreviousPage: pagedMembers.HasPreviousPage,
            HasNextPage: pagedMembers.HasNextPage);

        return Results.Ok(response);
    }

    [HttpGet("{organizationId}/users/{userId}")]
    public async Task<IResult> GetUser(Guid organizationId, Guid userId)
    {
        var user = await _currentUserService.GetUserAsync();
        var member = await _organizationService.GetMemberAsync(organizationId, userId, user);

        var response = new MemberResponse(
            UserId: member.UserId,
            Email: member.User.Email,
            Role: member.Role.ToString(),
            JoinedAt: member.JoinedAt,
            License: member.AssignedLicense != null ? new LicenseInfo(
                Id: member.AssignedLicense.Id,
                ExpiresAt: member.AssignedLicense.ExpiresAt,
                IsExpired: member.AssignedLicense.ExpiresAt <= DateTime.UtcNow,
                AutoRenewal: member.AssignedLicense.AutoRenewal) : null);

        return Results.Ok(response);
    }

    [HttpPut("{organizationId}/users/{userId}/role")]
    public async Task<IResult> UpdateUserRole(Guid organizationId, Guid userId, [FromBody] UpdateMemberRoleRequest request)
    {
        var user = await _currentUserService.GetUserAsync();

        if (!Enum.TryParse<OrganizationRole>(request.Role, true, out var role))
        {
            throw new BadRequestException("Invalid role", "Role must be Owner, Admin, or Member");
        }

        await _organizationService.UpdateMemberRoleAsync(organizationId, userId, role, user);
        return Results.NoContent();
    }

    [HttpPost("{organizationId}/users/{userId}/remove")]
    public async Task<IResult> RemoveUserFromOrganization(Guid organizationId, Guid userId)
    {
        var user = await _currentUserService.GetUserAsync();
        await _organizationService.RemoveMemberAsync(organizationId, userId, user);
        return Results.NoContent();
    }

    [HttpPost("{organizationId}/users/{userId}/license")]
    public async Task<IResult> AssignLicenseToUser(Guid organizationId, Guid userId, [FromBody] AssignLicenseRequest request)
    {
        var user = await _currentUserService.GetUserAsync();
        await _organizationService.AssignLicenseAsync(organizationId, userId, request.LicenseId, user);
        return Results.NoContent();
    }

    [HttpDelete("{organizationId}/users/{userId}/license")]
    public async Task<IResult> UnassignLicenseFromUser(Guid organizationId, Guid userId)
    {
        var user = await _currentUserService.GetUserAsync();
        await _organizationService.UnassignLicenseAsync(organizationId, userId, user);
        return Results.NoContent();
    }

    [HttpGet("{organizationId}/licenses")]
    public async Task<IResult> GetOrganizationLicenses(Guid organizationId, [FromQuery] PaginationRequest pagination)
    {
        var user = await _currentUserService.GetUserAsync();
        var pagedLicenses = await _organizationService.GetLicensesPagedAsync(organizationId, user, pagination);

        var response = new PagedResult<LicenseResponse>(
            Items: pagedLicenses.Items.Select(l => new LicenseResponse(
                Id: l.Id,
                OrganizationId: l.OrganizationId,
                AssignedToUserId: l.AssignedToUserId,
                AssignedToEmail: l.AssignedToUser?.Email,
                ExpiresAt: l.ExpiresAt,
                AutoRenewal: l.AutoRenewal,
                IsActive: l.IsActive,
                IsExpired: l.ExpiresAt <= DateTime.UtcNow,
                CreatedAt: l.CreatedAt,
                UpdatedAt: l.UpdatedAt)).ToList(),
            Page: pagedLicenses.Page,
            PageSize: pagedLicenses.PageSize,
            TotalCount: pagedLicenses.TotalCount,
            TotalPages: pagedLicenses.TotalPages,
            HasPreviousPage: pagedLicenses.HasPreviousPage,
            HasNextPage: pagedLicenses.HasNextPage);

        return Results.Ok(response);
    }
}
