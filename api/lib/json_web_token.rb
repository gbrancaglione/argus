require "openssl"
require "base64"
require "json"

module JsonWebToken
  module_function

  ALGORITHM = "HS256"
  EXPIRATION = 24 * 60 * 60 # 24 hours

  def encode(payload)
    now = Time.now.to_i
    payload = payload.merge(iat: now, exp: now + EXPIRATION)

    header = Base64.urlsafe_encode64({ alg: ALGORITHM, typ: "JWT" }.to_json, padding: false)
    body   = Base64.urlsafe_encode64(payload.to_json, padding: false)
    signature = sign("#{header}.#{body}")

    "#{header}.#{body}.#{signature}"
  end

  def decode(token)
    header, body, signature = token.to_s.split(".")
    return nil unless header && body && signature
    return nil unless secure_compare(signature, sign("#{header}.#{body}"))

    payload = JSON.parse(Base64.urlsafe_decode64(body), symbolize_names: true)
    return nil if payload[:exp] && Time.now.to_i > payload[:exp]

    payload
  rescue ArgumentError, JSON::ParserError
    nil
  end

  def sign(data)
    digest = OpenSSL::Digest.new("SHA256")
    Base64.urlsafe_encode64(
      OpenSSL::HMAC.digest(digest, secret, data),
      padding: false
    )
  end

  def secret
    Rails.application.secret_key_base
  end

  def secure_compare(a, b)
    ActiveSupport::SecurityUtils.secure_compare(a, b)
  end
end
