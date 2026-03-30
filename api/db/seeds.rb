admin_email = ENV.fetch("ADMIN_EMAIL", "admin@argus.com")
admin_password = ENV.fetch("ADMIN_PASSWORD", "password123")

User.find_or_create_by!(email: admin_email) do |user|
  user.password = admin_password
  user.password_confirmation = admin_password
end

puts "Seed user created: #{admin_email}"
