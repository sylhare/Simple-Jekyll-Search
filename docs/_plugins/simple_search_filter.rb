# Example usage in a Jekyll template:
#   {{ some_variable | remove_chars }}
#
# This will:
#   - Replace backslashes (\) with `&#92;`
#   - Replace tabs (\t) with four spaces
#   - Remove control characters and extended ASCII characters
#
# Not compatible with GitHub Pages unless pre-built
module Jekyll
  module CharFilter
    def remove_chars(input)
      input.gsub! '\\','&#92;'
      input.gsub! /\t/, '    '
      input.strip_control_and_extended_characters
    end
  end
end

Liquid::Template.register_filter(Jekyll::CharFilter)

# This ensures the resulting string contains only printable ASCII characters.
class String
  def strip_control_and_extended_characters()
    chars.each_with_object("") do |char, str|
      str << char if char.ascii_only? and char.ord.between?(32,126)
    end
  end
end