{
  description = "Nix shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    {
      devShell =
        let
          shell =
            { pkgs }:
            pkgs.mkShell {
              nativeBuildInputs = with pkgs; [
                nodejs_20
              ];
              shellHook = '''';
              ESLINT_USE_FLAT_CONFIG = "false";
            };
        in
        {
          x86_64-linux = shell {
            pkgs = nixpkgs.legacyPackages.x86_64-linux;
          };
          aarch64-linux = shell {
            pkgs = nixpkgs.legacyPackages.aarch64-linux;
          };
          aarch64-darwin = shell {
            pkgs = nixpkgs.legacyPackages.aarch64-darwin;
          };
        };
    };
}
