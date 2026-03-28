-- Add filter_key to services: slug-style key linking a service to its portfolio projects
ALTER TABLE services ADD COLUMN IF NOT EXISTS filter_key text;

-- Add service_category to projects: matches a service's filter_key for portfolio filtering
ALTER TABLE projects ADD COLUMN IF NOT EXISTS service_category text;
