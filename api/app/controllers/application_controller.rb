class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Authenticatable

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: e.message }, status: :bad_request
  end
end
