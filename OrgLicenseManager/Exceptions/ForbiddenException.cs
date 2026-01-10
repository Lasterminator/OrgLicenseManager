namespace OrgLicenseManager.Exceptions;

public class ForbiddenException : CustomException
{
    public ForbiddenException(string message, string? detail = null)
        : base(message, StatusCodes.Status403Forbidden, detail)
    {
    }
}
