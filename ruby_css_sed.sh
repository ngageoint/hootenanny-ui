sed -e 's/url(img\//url(<%= asset_path("iD\/img\//g' \
-e 's/\.png)/\.png") %>)/g' \
-e 's/\.gif)/\.gif") %>)/g' \
-e 's/\.svg)/\.svg") %>)/g' \
dist/iD.css > dist/iD.css.erb

