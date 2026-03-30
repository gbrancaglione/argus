module Authenticatable
  extend ActiveSupport::Concern

  private

  def authenticate!
    render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
  end

  def current_user
    @current_user ||= begin
      token = request.headers["Authorization"]&.split(" ")&.last
      payload = JsonWebToken.decode(token) if token
      User.find_by(id: payload[:user_id]) if payload
    end
  end
end
