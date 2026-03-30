require "test_helper"

class JsonWebTokenTest < ActiveSupport::TestCase
  test "encode returns a JWT string" do
    token = JsonWebToken.encode(user_id: 1)
    assert_kind_of String, token
    assert_equal 3, token.split(".").length
  end

  test "decode returns the payload" do
    token = JsonWebToken.encode(user_id: 42)
    payload = JsonWebToken.decode(token)
    assert_equal 42, payload[:user_id]
  end

  test "decode returns nil for invalid token" do
    assert_nil JsonWebToken.decode("invalid.token.here")
  end

  test "decode returns nil for tampered token" do
    token = JsonWebToken.encode(user_id: 1)
    tampered = token[0..-2] + "X"
    assert_nil JsonWebToken.decode(tampered)
  end

  test "decode returns nil for expired token" do
    payload = { user_id: 1, exp: 1.hour.ago.to_i }
    token = JWT.encode(payload, JsonWebToken.secret, "HS256")
    assert_nil JsonWebToken.decode(token)
  end

  test "decode returns nil for nil token" do
    assert_nil JsonWebToken.decode(nil)
  end
end
