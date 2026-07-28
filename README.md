# Normalise line endings so the repo behaves the same on Mac, Windows and Linux
* text=auto eol=lf

# Never let git mangle these
*.png  binary
*.jpg  binary
*.webp binary
*.ico  binary
*.pdf  binary
*.zip  binary

# Keep diffs readable for the files you will actually edit
*.html text diff=html
*.css  text
*.js   text
*.json text
*.toml text
*.md   text
