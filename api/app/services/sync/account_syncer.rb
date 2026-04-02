module Sync
  class AccountSyncer
    def initialize(user)
      @user = user
    end

    def call
      data = OpenFinance.client.accounts
      data["results"].map { |account_data| upsert_account(account_data) }
    end

    private

    def upsert_account(data)
      account = @user.accounts.find_or_initialize_by(external_id: data["id"])
      account.assign_attributes(
        name: data["name"],
        account_type: data["type"],
        account_subtype: data["subtype"],
        currency_code: data["currencyCode"] || "BRL",
        balance: data["balance"],
        item_id: data["itemId"] || extract_item_id(data),
        raw_data: data
      )
      account.save!
      account
    end

    def extract_item_id(data)
      data.dig("item", "id") || "unknown"
    end
  end
end
