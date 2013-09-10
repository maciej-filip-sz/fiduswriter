/**
 * This file is part of Fidus Writer <http://www.fiduswriter.org>
 *
 * Copyright (C) 2013 Takuto Kojima, Johannes Wilm
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
(function () {
    var exports = this,
        chatHelpers = {};

    chatHelpers.beep = function () {
        var notification = jQuery('#chat-notification')[0];
        notification.play();
    };

    chatHelpers.flashtab = function (messageTitle) {
        var origTitle = document.title;

        var changeDocumentTitle = setInterval(function () {
            if (theFocus) {
                clearInterval(changeDocumentTitle);
                document.title = origTitle;
            }
            else {
                document.title = (document.title === origTitle) ?
                    messageTitle : origTitle;
            }
        }, 500);
    };




    chatHelpers.messageTemplate = _.template(
        '\
        <div class="message" id="m<%= id %>">\
            <div class="comment-user">\
                <% var theChatter = _.findWhere(uniqueParticipantList, {id:from})%>\
                <img class="comment-user-avatar" src="<%= theChatter.avatar %>">\
                <h5 class="comment-user-name"><%= theChatter.name %></h5>\
                <p class="comment-date"><%= commentHelpers.localizeDate(new Date()) %></p>\
            </div>\
            <%- body %>\
        </div>\
    '
    );

    chatHelpers.newMessage = function (message) {
        var existing = jQuery("#m" + message.id);
        if (existing.length > 0) return;
        var node = jQuery(chatHelpers.messageTemplate(message));
        node.hide();

        var chatContainer = jQuery("#chat-container");
        chatContainer.append(node);
        if (!theFocus) {
            chatHelpers.beep();
            chatHelpers.flashtab(message.from + ': ' + message.body);
        }
        node.slideDown({progress: function () {
            chatContainer[0].scrollTop = chatContainer[0].scrollHeight;
        }});
        
    };

    chatHelpers.participantListTemplate = _.template(
        '<% _.each(participants, function(participant) { %><img src="<%= participant.avatar %>" alt="<%- participant.name %>" title="<%- participant.name %>"><% }); %>'
    );

    chatHelpers.updateParticipantList = function (data) {

        // If only one machine is connected and nothign has been chatted, don't show chat
        if (data.participant_list.length === 1 && jQuery(
            '#chat-container .message').length === 0) {
            jQuery('#chat').css('display', 'none');
            jQuery('#current-editors').css('display', 'none');
        }
        else {
            window.uniqueParticipantList = _.map(_.groupBy(data.participant_list,
                'id'), function (entry) {
                return entry[0]
            });
            jQuery('#current-editors').html(chatHelpers.participantListTemplate({
                participants: uniqueParticipantList
            }));
            jQuery('#chat').css('display', 'block');
            jQuery('#current-editors').css('display', 'block');
        }
    };

    chatHelpers.sendMessage = function (messageText) {
        ws.send(JSON.stringify({
            type: 'chat',
            body: messageText
        }));
    };

    chatHelpers.bind = function () {


        jQuery(document.head).append('<style>\n#messageform.empty:before{content:"'+gettext('Send a message...')+'"}\n</style>');
        
        jQuery(document).ready(function () {
            jQuery('#chat-container').css('max-height', jQuery(window).height() -
                200 + 'px');

            jQuery('#chat .resize-button').on("click", function () {
                if (jQuery(this).hasClass('icon-angle-double-down')) {
                    jQuery(this).removeClass('icon-angle-double-down');
                    jQuery(this).addClass('icon-angle-double-up');
                    //jQuery('#chat').css('height', '10px');
                    jQuery('#chat-container,#messageform').slideUp();
                } else {
                    jQuery(this).removeClass('icon-angle-double-up');
                    jQuery(this).addClass('icon-angle-double-down');
                    jQuery('#chat-container,#messageform').slideDown();
                }
            });
            
            jQuery("#messageform").on("focus", function () {
                jQuery(this).removeClass('empty');
            });
            
            jQuery("#messageform").on("blur", function () {
                if (jQuery(this).text().length===0) {
                    jQuery(this).addClass('empty');
                }
            });
            
            
            jQuery("#messageform").on("keypress", function (e) {
                if (e.keyCode == 13) {
                    chatHelpers.sendMessage(jQuery(this).text());
                    jQuery(this).empty();
                    return false;
                }
            });


        });




        window.theFocus = true;

        jQuery(window).on("blur focus", function (e) {
            var prevType = jQuery(this).data("prevType");

            if (prevType != e.type) { //  reduce double fire issues
                switch (e.type) {
                case "blur":
                    theFocus = false;
                    break;
                case "focus":
                    theFocus = true;
                    break;
                }
            }

            jQuery(this).data("prevType", e.type);

        })
    };


    exports.chatHelpers = chatHelpers;

}).call(this);