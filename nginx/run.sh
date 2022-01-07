#!/bin/bash

set -e

python3 -c "
from jinja2 import Template
from os import environ
template = Template(open('/etc/nginx/nginx.template.conf').read())
print(template.render(env = environ))
" > /etc/nginx/nginx.conf

# Run nginx
nginx -g "daemon off;" &

# Wait for kartotherian to be ready
sleep 5

# Run expire tiles service
./expire.sh
