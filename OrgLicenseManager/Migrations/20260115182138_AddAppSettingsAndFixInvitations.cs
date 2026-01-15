using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrgLicenseManager.Migrations
{
    /// <inheritdoc />
    public partial class AddAppSettingsAndFixInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invitations_Users_InvitedByUserId",
                table: "Invitations");

            migrationBuilder.AlterColumn<Guid>(
                name: "InvitedByUserId",
                table: "Invitations",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateTable(
                name: "AppSettings",
                columns: table => new
                {
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppSettings", x => x.Key);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Invitations_Users_InvitedByUserId",
                table: "Invitations",
                column: "InvitedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invitations_Users_InvitedByUserId",
                table: "Invitations");

            migrationBuilder.DropTable(
                name: "AppSettings");

            migrationBuilder.AlterColumn<Guid>(
                name: "InvitedByUserId",
                table: "Invitations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Invitations_Users_InvitedByUserId",
                table: "Invitations",
                column: "InvitedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
