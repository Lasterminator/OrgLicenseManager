namespace OrgLicenseManager.Entities;

public class Invitation
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string Email { get; set; } = null!;
    public string Token { get; set; } = null!;
    public OrganizationRole Role { get; set; }
    public DateTime ExpiresAt { get; set; }
    public Guid? InvitedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Organization Organization { get; set; } = null!;
    public User? InvitedByUser { get; set; }
}
