#!/bin/bash
set -e
sudo apt-get update && sudo apt-get install -y postgresql-client
# We can't really run pgtap without a local postgres instance that has the extensions, which is what supabase test db does.
