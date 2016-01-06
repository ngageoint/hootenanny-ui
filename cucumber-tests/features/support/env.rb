require 'rubygems'
require 'capybara'
require 'capybara/dsl'
require 'rspec'
require 'capybara/webkit'

Capybara.register_driver :chrome do |app|
  Capybara::Selenium::Driver.new(app, :browser => :chrome)
end
Capybara.javascript_driver = :chrome # :selenium
Capybara.default_driver = :chrome #:selenium

Capybara.run_server = false
Capybara.default_selector = :css

module Helpers
  def without_resynchronize
    page.driver.options[:resynchronize] = false
    yield
    page.driver.options[:resynchronize] = true
  end
end

World(Capybara::DSL, Helpers)