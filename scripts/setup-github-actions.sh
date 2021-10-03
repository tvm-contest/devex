#!/bin/bash
# You can safely delete this file after you've setup your docker repo in .github/workflows/latest.yml

project_name="free-ton-notifications-service"
filename=".github/workflows/latest.yml"
default_repo="Strafi/free-ton-notifications-service/free-ton-notifications-service"

configure_github_actions() {
  read -p "Enter your Github username: "  github_user
  read -p "Enter this app's Github repo name: "  project_name

  docker_repo="$github_user/$project_name/$project_name"
  sed -i '' "s+$default_repo+$docker_repo+g" $filename
  echo "Configured Github Docker Repo to: ${docker_repo}"
}

configure_github_actions
