const { React, getModule } = require('powercord/webpack');

const { getButton } = require('./components/Button');
const { getQuickLensSettings } = require('./components/QuickLensSettings');
const ImageResolve = getModule([ 'getUserAvatarURL' ], false).default;

module.exports.imageModal = function (args, res, settings) {
  const ImageWrapper = require('./components/ImageWrapper');
  const patchImageSize = settings.get('patchImageSize', true);

  if (patchImageSize) {
    const imgComp = res.props.children[0].props;
    const { height, width } = imgComp;
    imgComp.height = height * 2;
    imgComp.width = width * 2;
    imgComp.maxHeight = 600;
    imgComp.maxWidth = 1200;
  }

  res.props.children.unshift(
    React.createElement(ImageWrapper, {
      children: res.props.children.shift(),
      getSetting: settings.get
    })
  );
  return res;
};

module.exports.message = function ([ { target, message: { content } } ], res, settings) {
  if ((target.tagName === 'IMG') || (target.tagName === 'VIDEO' && target.loop)) {
    const { width, height } = target;
    const menu = res.props.children;
    const hideNativeButtons = settings.get('hideNativeButtons', true);

    if (hideNativeButtons) {
      for (let i = menu.length - 1; i >= 0; i -= 1) {
        const e = menu[i];
        if (Array.isArray(e.props.children) && e.props.children[0]) {
          if (e.props.children[0].key === 'copy-image' || e.props.children[0].key === 'copy-native-link') {
            menu.splice(i, 1);
          }
        }
      }
    }

    const args = {
      content,
      width: width * 2,
      height: height * 2
    };
    menu.splice(
      3, 0, getButton(
        getImagesObj(target, args), // eslint-disable-line no-use-before-define
        settings
      )
    );
  }
  return res;
};

module.exports.user = function ([ { user } ], res, settings) {
  const images = {
    png: { src: ImageResolve.getUserAvatarURL(user, 'png', 2048) },
    gif:  ImageResolve.hasAnimatedAvatar(user) ? { src: ImageResolve.getUserAvatarURL(user, 'gif', 2048) } : null,
    webp: { src: ImageResolve.getUserAvatarURL(user, 'webp', 2048) }
  };
  res.props.children.props.children.splice(6, 0, getButton(images, settings));
  return res;
};

module.exports.guild = function ([ { guild } ], res, settings) {
  const opts = {
    id: guild.id,
    icon: guild.icon,
    size: 4096
  };
  const images = {
    png: { src: ImageResolve.getGuildIconURL(opts).replace('.webp?', '.png?') },
    gif: ImageResolve.hasAnimatedGuildIcon(guild) ? { src:  ImageResolve.getGuildIconURL(opts).replace('.webp?', '.gif?') } : null,
    webp: { src: ImageResolve.getGuildIconURL(opts) }
  };
  res.props.children.splice(6, 0, getButton(images, settings));
  return res;
};

module.exports.image = function ([ { target } ], res, settings) {
  const images = getImagesObj(target); // eslint-disable-line no-use-before-define
  const button = getButton(images, settings);

  button.props.children[0].props.disabled = true; // "open image"
  res.props.children = button.props.children;
  res.props.children.push(getQuickLensSettings(settings));
  return res;
};

function getImagesObj (target, obj) {
  const img = {};
  const src = target.src.split('?').shift();
  let e = src.split('.').pop();
  if (e.length > 3) {
    e = src.split('/').pop();
  }
  img[e] = { src, ...obj }; // eslint-disable-line object-property-newline
  return img;
}
