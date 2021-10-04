const path = require('path');

const request = require('./request');

const attributeService = require('../../services/attributes');
const noteService = require('../../services/notes');
const dateNoteService = require('../../services/date_notes');
const dateUtils = require('../../services/date_utils');
const imageService = require('../../services/image');
const utils = require('../../services/utils');

const Attribute = require('../../entities/attribute');

const cls = require('../../services/cls');

const processContent = async (images, note, content) => {
  let rewrittenContent = content;

  if (images) {
    for (const { src, imageId } of images) {
      const filename = path.basename(src);

      const buffer = await request({ path: src, json: false });

      const {note: imageNote, url} = imageService.saveImage(note.noteId, buffer, filename, true);

      new Attribute({
        noteId: imageNote.noteId,
        type: 'label',
        name: 'archived'
      }).save(); // so that these image notes don't show up in search / autocomplete

      new Attribute({
        noteId: note.noteId,
        type: 'relation',
        name: 'imageLink',
        value: imageNote.noteId
      }).save();

      console.log(`Replacing ${imageId} with ${url}`);

      rewrittenContent = utils.replaceAll(rewrittenContent, imageId, url);
    }
  }

  return rewrittenContent;
}

function getClipperInboxNote() {
  let clipperInbox = attributeService.getNoteWithLabel('clipperInbox');

  if (!clipperInbox) {
    clipperInbox = dateNoteService.getDateNote(dateUtils.localNowDate());
  }

  return clipperInbox;
}

module.exports = async data => {
  let { title, content, pageUrl, images, clipType = 'page', tags = [] } = data;

  if (!title || !title.trim()) {
    title = 'Clipped note from ' + pageUrl;
  }

  cls.init(async () => {
    const clipperInbox = getClipperInboxNote();

    const { note } = noteService.createNewNote({
      parentNoteId: clipperInbox.noteId,
      title,
      content,
      type: 'text'
    });

    note.setLabel('clipType', clipType);

    if (pageUrl) {
      note.setLabel('pageUrl', pageUrl);
    }

    if (tags.length > 0) {
      for (const value of tags) {
        new Attribute({
          noteId: note.noteId,
          type: 'label',
          name: 'tag',
          value
        }).save();
      }
    }

    const rewrittenContent = await processContent(images, note, content);

    note.setContent(rewrittenContent);
  });
}
