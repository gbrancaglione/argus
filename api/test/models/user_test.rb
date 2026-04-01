require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "valid user" do
    user = User.new(email: "test@example.com", password: "password", password_confirmation: "password")
    assert user.valid?
  end

  test "requires email" do
    user = User.new(password: "password", password_confirmation: "password")
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "requires unique email" do
    user = User.new(email: users(:admin).email, password: "password", password_confirmation: "password")
    assert_not user.valid?
    assert_includes user.errors[:email], "has already been taken"
  end

  test "rejects invalid email format" do
    user = User.new(email: "not-an-email", password: "password", password_confirmation: "password")
    assert_not user.valid?
    assert_includes user.errors[:email], "is invalid"
  end

  test "requires password" do
    user = User.new(email: "test@example.com")
    assert_not user.valid?
    assert_includes user.errors[:password], "can't be blank"
  end

  test "authenticates with correct password" do
    user = users(:admin)
    assert user.authenticate("password123")
  end

  test "rejects wrong password" do
    user = users(:admin)
    assert_not user.authenticate("wrong")
  end
end
