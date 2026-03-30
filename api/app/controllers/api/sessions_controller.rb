module Api
  class SessionsController < ApplicationController
    def create
      user = User.find_by(email: params[:email])

      if user&.authenticate(params[:password])
        token = JsonWebToken.encode(user_id: user.id)
        set_auth_cookie(token)
        render json: { user: { id: user.id, email: user.email } }
      else
        render json: { error: "Invalid email or password" }, status: :unauthorized
      end
    end

    def destroy
      cookies.delete(:jwt, domain: :all)
      head :no_content
    end

    private

    def set_auth_cookie(token)
      cookies[:jwt] = {
        value: token,
        httponly: true,
        secure: Rails.env.production?,
        same_site: :lax,
        expires: 24.hours.from_now
      }
    end
  end
end
