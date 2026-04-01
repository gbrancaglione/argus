class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Authenticatable
end
