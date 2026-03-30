User.find_or_create_by!(email: "admin@argus.com") do |user|
  user.password = "password123"
  user.password_confirmation = "password123"
end

puts "Seed user created: admin@argus.com / password123"
