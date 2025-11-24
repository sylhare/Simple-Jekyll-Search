# encoding: utf-8
# frozen_string_literal: true

# Same as `simple_search_filter.rb`, but with additional adapted for Chinese characters
# Example usage in a Jekyll template:
#   {{ some_variable | remove_chars_cn }}
#
# This will remove the following characters from `some_variable`:
#   - Backslashes (\) are replaced with `&#92;`
#   - Tabs (\t) are replaced with four spaces
#   - The following characters are removed: @, $, %, &, ", {, }
#
# Not compatible with GitHub page unless pre-built
module Jekyll
  module CharFilter
    def remove_chars_cn(input)
      input.gsub! '\\', '&#92;'
      input.gsub! /\t/, '    '
      input.gsub! '@', ''
      input.gsub! '$', ''
      input.gsub! '%', ''
      input.gsub! '&', ''
      input.gsub! '"', ''
      input.gsub! '{', ''
      input.gsub! '}', ''
      input
    end
  end
end

# Registers the `remove_chars_cn` filter for use in Jekyll templates.
Liquid::Template.register_filter(Jekyll::CharFilter)