require "net/http"
require "json"
require "uri"

module OpenFinance
  module Adapters
    class Pluggy < OpenFinance::Client
      BASE_URL = "https://api.pluggy.ai"
      TOKEN_BUFFER = 60

      def accounts(item_id = nil)
        item_ids = (item_id || ENV.fetch("PLUGGY_ITEM_ID")).split(",")
        all_results = item_ids.flat_map do |id|
          get("/accounts", params: { itemId: id.strip })["results"]
        end
        { "results" => all_results }
      end

      def transactions(account_id:, from:, to:, page: 1, page_size: 500)
        get("/transactions", params: {
          accountId: account_id,
          from: from,
          to: to,
          page: page,
          pageSize: page_size
        })
      end

      private

      def get(path, params: {})
        uri = URI("#{BASE_URL}#{path}")
        uri.query = URI.encode_www_form(params) if params.any?

        request = Net::HTTP::Get.new(uri)
        request["X-API-KEY"] = api_key
        request["Content-Type"] = "application/json"

        response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 30) do |http|
          http.request(request)
        end

        body = JSON.parse(response.body)

        unless response.is_a?(Net::HTTPSuccess)
          raise OpenFinance::Error.new(
            body["message"] || "Pluggy API error",
            status: response.code.to_i
          )
        end

        body
      end

      def api_key
        if @api_key && @token_expires_at && Time.now < @token_expires_at
          return @api_key
        end

        authenticate!
      end

      def authenticate!
        uri = URI("#{BASE_URL}/auth")
        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/json"
        request.body = {
          clientId: ENV.fetch("PLUGGY_CLIENT_ID"),
          clientSecret: ENV.fetch("PLUGGY_CLIENT_SECRET")
        }.to_json

        response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 30) do |http|
          http.request(request)
        end

        body = JSON.parse(response.body)

        unless response.is_a?(Net::HTTPSuccess)
          raise OpenFinance::Error.new("Pluggy authentication failed: #{body['message']}")
        end

        @api_key = body["apiKey"]
        payload = JWT.decode(@api_key, nil, false)[0]
        @token_expires_at = Time.at(payload["exp"]) - TOKEN_BUFFER
        @api_key
      end
    end
  end
end
