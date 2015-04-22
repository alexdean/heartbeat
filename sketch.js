function Graph(c) {
  self = this;

  this.width  = c.width  - (2 * c.padding.x);
  this.height = c.height - (2 * c.padding.y);

  var px_per_hour = this.width / c.graph.hours;
  var px_per_view = this.height / c.graph.max_views;

  // convert (hour, views) to (x, y)
  this.to_xy = function(pair) {
    var hour = pair[0];
    var views = pair[1];
    return {
      x: this.lower_left.x + hour * px_per_hour,
      y: this.lower_left.y - views * px_per_view
    }
  }

  this.draw_x_axis = function() {
    line(
      this.lower_left.x,
      this.lower_left.y,
      this.lower_right.x,
      this.lower_right.y
    )

    textSize(c.graph.axis_text_size);
    stroke(0);
    noFill();
    textAlign(CENTER);

    for(var i=0; i<=c.graph.hours; i++) {
      text(i, this.lower_left.x + i*px_per_hour, this.lower_left.y + 12)
    }
  }
  this.draw_y_axis = function() {
    line(
      this.upper_left.x,
      this.upper_left.y,
      this.lower_left.x,
      this.lower_left.y
    )
    textSize(c.graph.axis_text_size);
    stroke(0);
    noFill();
    textAlign(RIGHT);
    for(var i=0; i<=c.graph.max_views; i+=100) {
      text(i, this.lower_left.x - 2, this.lower_left.y - px_per_view * i)
    }
  }
  this.draw_date = function(date) {
    textSize(c.date_box.text_size);
    textAlign(LEFT);

    var d = moment(date);
    text(
      d.format("MMMM Do YYYY"),
      c.padding.x + this.width - c.date_box.width,
      c.padding.y + c.date_box.text_size * 2
    );
    text(
      d.format("dddd"),
      c.padding.x + this.width - c.date_box.width,
      c.padding.y + c.date_box.text_size
    );
  }
  this.draw_video = function(series) {
    var len = series.length;
    if (len < 2) {
      return;
    }

    stroke(0);
    noFill();
    var prev = self.to_xy(series[0]);
    for(var i=1; i<len; i++) {
      var current = self.to_xy(series[i]);
      line(prev.x, prev.y, current.x, current.y);
      prev = current;
    }
  }
  this.draw_control = function(series) {
    var HOUR = 0;
    var UPPER = 1;
    var LOWER = 2;

    var len = series.length;
    if (len < 2) {
      return;
    }

    noStroke();
    fill(255, 204, 0);

    var prev = series[0];
    for(var i=1; i<len; i++) {
      var current = series[i];

      var p1 = self.to_xy([prev[HOUR], prev[LOWER]]);
      var p2 = self.to_xy([prev[HOUR], prev[UPPER]]);
      var p3 = self.to_xy([current[HOUR], current[UPPER]]);
      var p4 = self.to_xy([current[HOUR], current[LOWER]]);

      quad(
        p1.x, p1.y,
        p2.x, p2.y,
        p3.x, p3.y,
        p4.x, p4.y
      );

      prev = current;
    }
  }

  this.lower_left = {
    x: c.padding.x,
    y: c.padding.y + this.height
  };
  this.lower_right = {
    x: c.padding.x + this.width,
    y: c.padding.y + this.height
  };
  this.upper_left = {
    x: c.padding.x,
    y: c.padding.y
  },
  this.upper_right = {
    x: config.padding.x + this.width,
    y: config.padding.y
  }
};

var g; // Graph instance
var data;
var config = {
  frame_rate: 6,
  width: 800,
  height: 480,
  date_box: {
    text_size: 36,
    width: 350
  },
  padding: {
    x: 25,
    y: 25
  },
  graph: {
    hours: 24,
    max_views: 400,
    axis_text_size: 12
  }
};

function preload() {
  data = loadJSON('heartbeat.json');
  // heartbeat.json has the structure:
  // [
  //   {
  //     "date": "2013-05-01",
  //     "talk": {
  //       "title": "Sebastião Salgado: The silent drama of photography",
  //       "series": [
  //         [
  //           hour since publication,
  //           avg views/min
  //         ],
  //         [
  //           hour since publication,
  //           avg views/min
  //         ],
  //         ...
  //       ]
  //     },
  //     "control": {
  //       "range": {
  //         "begin": "2013-03-31",
  //         "end": "2013-04-30"
  //       },
  //       "series": [
  //         [
  //           hour,
  //           normal upper views/min,
  //           normal lower views/min
  //         ],
  //         [
  //           hour,
  //           normal upper views/min,
  //           normal lower views/min
  //         ]
  //       ]
  //     }
  //   }
  //   ... repeated for each day.
  // ]
}

function setup() {
  g = new Graph(config);
  colorMode(RGB);
  createCanvas(config.width, config.height);
  textFont("sans-serif");
  frameRate(config.frame_rate);
}

function draw() {

  clear();

  g.draw_x_axis();
  g.draw_y_axis();

  var current = data[frameCount];
  if (current) {
    g.draw_date(current.date);
    g.draw_control(current.control.series);
    g.draw_video(current.talk.series);
  } else {
    noLoop();
  }

}
