#!/bin/bash

echo What should the version be?
read VERSION
echo $VERSION

docker build -t speckope/forum:$VERSION .
docker push speckope/forum:$VERSION
ssh root@104.248.143.102 "docker pull speckope/forum:$VERSION && docker tag speckope/forum:$VERSION dokku/fullstack-api:$VERSION && dokku deploy fullstack-api $VERSION"