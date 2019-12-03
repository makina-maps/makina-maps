x_min, x_max = ARGV[0].split('-').collect(&:to_i)
y_min, y_max = ARGV[1].split('-').collect(&:to_i)

1.upto(14).each{ |z|
  (x_min/z**2).upto((x_max/z**2)).each{ |x|
    (y_min/z**2).upto((y_max/z**2)).each{ |y|
      puts "#{14-(z-1)},#{x},#{y}"
    }
  }
}
