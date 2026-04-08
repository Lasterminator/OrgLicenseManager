using OrgLicenseManager.Contracts.Common;
using OrgLicenseManager.Entities;
using OrgLicenseManager.Exceptions;
using OrgLicenseManager.Services;

namespace OrgLicenseManager.Tests;

public class OrganizationServiceTests
{
    [Fact]
    public async Task DeleteAsync_Rejects_Admin_User()
    {
        using var connection = TestDbFactory.CreateConnection();
        await using var context = TestDbFactory.CreateContext(connection);
        var service = new OrganizationService(context);

        var owner = CreateUser("owner@acme.io");
        var admin = CreateUser("admin@acme.io");
        context.Users.AddRange(owner, admin);

        var organization = await service.CreateAsync("Acme", "Team workspace", owner);
        context.OrganizationMemberships.Add(new OrganizationMembership
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            UserId = admin.Id,
            Role = OrganizationRole.Admin,
            JoinedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        var exception = await Assert.ThrowsAsync<ForbiddenException>(() => service.DeleteAsync(organization.Id, admin));

        Assert.Equal("Insufficient permissions", exception.Message);
    }

    [Fact]
    public async Task UpdateMemberRoleAsync_Prevents_Admin_From_Promoting_To_Owner()
    {
        using var connection = TestDbFactory.CreateConnection();
        await using var context = TestDbFactory.CreateContext(connection);
        var service = new OrganizationService(context);

        var owner = CreateUser("owner@acme.io");
        var admin = CreateUser("admin@acme.io");
        var member = CreateUser("member@acme.io");
        context.Users.AddRange(owner, admin, member);

        var organization = await service.CreateAsync("Acme", null, owner);
        context.OrganizationMemberships.AddRange(
            new OrganizationMembership
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                UserId = admin.Id,
                Role = OrganizationRole.Admin,
                JoinedAt = DateTime.UtcNow,
            },
            new OrganizationMembership
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                UserId = member.Id,
                Role = OrganizationRole.Member,
                JoinedAt = DateTime.UtcNow,
            });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateMemberRoleAsync(organization.Id, member.Id, OrganizationRole.Owner, admin));
    }

    [Fact]
    public async Task RemoveMemberAsync_Rejects_Removing_Owner()
    {
        using var connection = TestDbFactory.CreateConnection();
        await using var context = TestDbFactory.CreateContext(connection);
        var service = new OrganizationService(context);

        var owner = CreateUser("owner@acme.io");
        var secondOwner = CreateUser("second-owner@acme.io");
        context.Users.AddRange(owner, secondOwner);

        var organization = await service.CreateAsync("Acme", null, owner);
        context.OrganizationMemberships.Add(new OrganizationMembership
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            UserId = secondOwner.Id,
            Role = OrganizationRole.Owner,
            JoinedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        var exception = await Assert.ThrowsAsync<BadRequestException>(() =>
            service.RemoveMemberAsync(organization.Id, secondOwner.Id, owner));

        Assert.Equal("Cannot remove owner", exception.Message);
    }

    [Fact]
    public async Task GetLicensesPagedAsync_Allows_Regular_Members()
    {
        using var connection = TestDbFactory.CreateConnection();
        await using var context = TestDbFactory.CreateContext(connection);
        var service = new OrganizationService(context);

        var owner = CreateUser("owner@acme.io");
        var member = CreateUser("member@acme.io");
        context.Users.AddRange(owner, member);

        var organization = await service.CreateAsync("Acme", null, owner);
        context.OrganizationMemberships.Add(new OrganizationMembership
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            UserId = member.Id,
            Role = OrganizationRole.Member,
            JoinedAt = DateTime.UtcNow,
        });
        context.Licenses.Add(new License
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            AssignedToUserId = member.Id,
            AutoRenewal = true,
            IsActive = true,
            ExpiresAt = DateTime.UtcNow.AddDays(10),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        var result = await service.GetLicensesPagedAsync(organization.Id, member, new PaginationRequest());

        Assert.Single(result.Items);
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
}
