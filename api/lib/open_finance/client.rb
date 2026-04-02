module OpenFinance
  class Client
    def accounts(item_id)
      raise NotImplementedError, "#{self.class}#accounts must be implemented"
    end

    def transactions(account_id:, from:, to:, page: 1, page_size: 500)
      raise NotImplementedError, "#{self.class}#transactions must be implemented"
    end
  end
end
