var buffers = require('buffers');
var http = require('http');

// Sets the hook for data : parse the body and retrieves attachments
exports.hook_data = function(next, connection) {
  connection.transaction.parse_body = 1;
  connection.notes.attachments = [];
  connection.transaction.attachment_hooks(onAttachment(connection));
  next();
};

// Hook to process the queue
exports.hook_queue = function(next, connection) {

	var transaction = connection.transaction;
	var body = transaction.body;
	var headers = body.header.headers_decoded;
	var attachments = connection.notes.attachments;

    var message = {
        'to' : headers['to'] ? headers['to'] : null,
		'from' : headers['from'] ? headers['from'][0] : null,
		'subject' : headers['subject'] ? headers['subject'][0] : null,
		'headers' : headers,
        'content-type' : body.ct,
        'body' : body.bodytext,
        'children' : extractChildren(body.children),
		'attachments' : attachments
    };
	
	var recipients = transaction.rcpt_to;
	recipients.forEach(function(element, index){
		var mailHost = element.host;
		this.loginfo("Mail Host : "+mailHost);
		var notificationUrl = getNotificationUrlForMailHost(mailHost);
		if (notificationUrl != null) {
			postJsonObject.call(this, '92.222.14.151', '/email.php', message, 'utf8');
		}
	}.bind(this));
	
    return next();
};

// Get notification url
function getNotificationUrlForMailHost(mailHost) {
	return {
		'host' : '92.222.14.151',
		'path' : '/email.php'
	}
}

// Post Json content
function postJsonObject(host, path, object, encoding) {
	
	var postData = JSON.stringify(object);

	// An object of options to indicate where to post to
	var postOptions = {
		'host' : host,
		'port' : '80',
		'path' : path,
		'method' : 'POST',
		'headers' : {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(postData, encoding)
		}
	};

	// Set up the request
	var postReq = http.request(postOptions, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			this.loginfo('Response: ' + chunk);
		}.bind(this));
	}.bind(this));

	// post the data
	postReq.write(postData);
	postReq.end();
}

// Extract the children for multipart MIME
function extractChildren(children) {
    return children.map(function(child) {
        var data = {
            bodytext: child.bodytext,
            headers: child.header.headers_decoded
        };
        if (child.children.length > 0) data.children = extractChildren(child.children);
        return data;
    });
}

// Returns hook wich adds each attachment to connection.notes.attachments
function onAttachment(connection) {
	var transaction = connection.transaction;
	var notes = connection.notes;

	return function(content_type, filename, body, stream) {
		var start = new Date().getTime();
		var attachment = {};
		var bufs = buffers();

		attachment.filename = filename;
		attachment.content_type = content_type;

		stream.on('data', function(data) {
		    bufs.push(data);
		});

		stream.on('end', function() {
		    var b = bufs.toBuffer();
		    attachment.data = b.toString('base64');
		    notes.attachments.push(attachment);
		});
	};
}