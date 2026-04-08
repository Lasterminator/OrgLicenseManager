using OrgLicenseManager.Entities;
using OrgLicenseManager.Exceptions;
using OrgLicenseManager.Services;

namespace OrgLicenseManager.Tests;

public class InvitationServiceTests
{
    [Fact]
    public async Task AcceptAsync_Rejects_Email_Mismatch()
    {
        using var connection = TestDbFactory.CreateConnection();
        await using var context = TestDbFactory.CreateContext(connection);
        var service = new InvitationService(context, new NoOpEmailService());

        var owner = CreateUser("owner@acme.io");
        var invitee = CreateUser("invitee@acme.io");
        var wrongUser = CreateUser("wrong@acme.io");
        context.Users.AddRange(owner, invitee, wrongUser);

        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Acme",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        context.Organizations.Add(organization);
        context.OrganizationMemberships.Add(new OrganizationMembership
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            UserId = owner.Id,
            Role = OrganizationRole.Owner,
            JoinedAt = DateTime.UtcNow,
        });
        context.Invitations.Add(new Invitation
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            Email = invitee.Email,
            Token = "invite-token",
            Role = OrganizationRole.Member,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            InvitedByUserId = owner.Id,
            CreatedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<ForbiddenException>(() => service.AcceptAsync("invite-token", wrongUser));
    }

    private static User CreateUser(string email)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            ExternalId = email,
            Email = email,
            Role = "User",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }

    private sealed class NoOpEmailService : IEmailService
    {
        public Task SendInvitationEmailAsync(string toEmail, string organizationName, string invitationToken)
        {
            return Task.CompletedTask;
        }
    }
}
