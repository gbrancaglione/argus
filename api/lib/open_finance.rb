module OpenFinance
  class Error < StandardError
    attr_reader :status

    def initialize(message, status: nil)
      @status = status
      super(message)
    end
  end

  class << self
    def client
      @client ||= build_client
    end

    def adapter=(name)
      @adapter = name
      @client = nil
    end

    def adapter
      @adapter ||= ENV.fetch("OPEN_FINANCE_ADAPTER", "pluggy")
    end

    def client=(new_client)
      @client = new_client
    end

    def reset!
      @client = nil
    end

    private

    def build_client
      case adapter
      when "pluggy"
        OpenFinance::Adapters::Pluggy.new
      else
        raise Error, "Unknown Open Finance adapter: #{adapter}"
      end
    end
  end
end
