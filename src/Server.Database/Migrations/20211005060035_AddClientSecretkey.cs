using Microsoft.EntityFrameworkCore.Migrations;

namespace Server.Database.Migrations
{
    public partial class AddClientSecretkey : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SecretKey",
                table: "ClientInfos",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SecretKey",
                table: "ClientInfos");
        }
    }
}
