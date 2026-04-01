module JsonWebToken
  module_function

  ALGORITHM = "HS256"
  EXPIRATION = 24.hours.to_i

  def encode(payload)
    payload[:exp] = Time.now.to_i + EXPIRATION
    JWT.encode(payload, secret, ALGORITHM)
  end

  def decode(token)
    body = JWT.decode(token, secret, true, { algorithm: ALGORITHM })[0]
    body.symbolize_keys
  rescue JWT::ExpiredSignature, JWT::DecodeError
    nil
  end

  def secret
    Rails.application.secret_key_base
  end
end
