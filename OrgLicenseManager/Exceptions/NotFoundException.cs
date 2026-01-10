namespace OrgLicenseManager.Exceptions;

public class NotFoundException : CustomException
{
    public NotFoundException(string message, string? detail = null)
        : base(message, StatusCodes.Status404NotFound, detail)
    {
    }
}
