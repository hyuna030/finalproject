import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './HomeScreen.web';
import LoginScreen from './LoginScreen.web'; // 파일 이름 변경
import RegisterScreen from './RegisterScreen.web'; // 파일 이름 변경
import ProfileScreen from './ProfileScreen.web';
import Banner1Screen from './Banner1Screen.web';
import Banner2Screen from './Banner2Screen.web';
import FindEmailScreen from './FindEmailScreen.web';
import FindPasswordScreen from './FindPasswordScreen.web';
import AboutUsScreen from './AboutUsScreen.web';
import AnnouncementScreen from './AnnouncementScreen.web';
import EventScreen from './EventScreen.web';
import PrivacyPolicyScreen from './PrivacyPolicyScreen.web';
import EmailPolicyScreen from './EmailPolicyScreen.web';
import GrowPlantScreen from './GrowPlantScreen.web';
import EditorPickScreen from './EditorPickScreen.web';
import MyFriendScreen from './MyFriendScreen.web';
import AroundPeopleScreen from './AroundPeopleScreen.web';
import ShareStoryScreen from './ShareStoryScreen.web';
import PlantPickScreen from './PlantPickScreen.web';


const logoImage = require('./image/flowe_wide.png');
const logosmall = require('./image/flowe_logo.png');
const flower5 = require('./image/flower5.png');
const flower6 = require('./image/flower6.png');
const banner1 = require('./image/banner1.png');
const banner2 = require('./image/banner2.png');
const banner3 = require('./image/banner3.png');
const right_arrow = require('./image/right_arrow.png');
const left_arrow = require('./image/left_arrow.png');
const floating_button = require('./image/floating_button.png');
const close_button = require('./image/close_button.png');
const search_button = require('./image/search_button.png');
const email_icon = require('./image/email_icon.png');
const halfbackground = require('./image/halfbackground.png');
const notice = require('./image/notice.png');
const arrow = require('./image/arrow.png');
const basic_profile = require('./image/basic_profile.png');
const edit_icon = require('./image/edit_icon.png');
const threedots = require('./image/threedots.png');
const testlink = require('./image/testlink.png');
const catgrass_select = require('./image/catgrass_select.png');
const basil_select = require('./image/basil_select.png');
const lettuce_select = require('./image/lettuce_select.png');
const carrot_select = require('./image/carrot_select.png');
const tomato_select = require('./image/tomato_select.png');
const extra_select = require('./image/extra_select.png');
const leftarrow = require('./image/leftarrow.png');

const plantName = require('./image/plantName.png');
const plantType = require('./image/plantType.png');
const plantWater = require('./image/plantWater.png');
const calendar = require('./image/calendar.png');
const testgif = require('./image/testgif.gif');
const plantexplain = require('./image/plantexplain.png');
const flowerpot = require('./image/flowerpot.png');
const sprout = require('./image/sprout.png');
const carrot1 = require('./image/carrot1.png');
const carrot2 = require('./image/carrot2.png');
const lettuce1 = require('./image/lettuce1.png');
const lettuce2 = require('./image/lettuce2.png');
const catgrass1 = require('./image/catgrass1.png');
const catgrass2 = require('./image/catgrass2.png');
const tomato1 = require('./image/tomato1.png');
const tomato2 = require('./image/tomato2.png');
const basil1 = require('./image/basil1.png');
const basil2 = require('./image/basil2.png');
const extra1 = require('./image/extra1.png');
const extra2 = require('./image/extra2.png');
const daterange = require('./image/daterange.png');
const speechbubble = require('./image/speechbubble.png');
const diarydefault = require('./image/diarydefault.png');
const diaryprev = require('./image/diaryprev.png');
const diarynext = require('./image/diarynext.png');
const diaryedit = require('./image/diaryedit.png');
const diarydelete = require('./image/diarydelete.png');

const heart = require('./image/heart.png');
const level1 = require('./image/level1.png');
const level2 = require('./image/level2.png');
const level3 = require('./image/level3.png');
const level4 = require('./image/level4.png');
const level5 = require('./image/level5.png');

const selectedimage = require('./image/selectedimage.png');
const unselectedimage = require('./image/unselectedimage.png');

const plantpickclose = require('./image/plantpickclose.png');
const plate = require('./image/plate.png');
const bouquet = require('./image/bouquet.png');
const sun = require('./image/sun.png');
const window = require('./image/window.png');
const clover = require('./image/clover.png');
const blossom = require('./image/blossom.png');
const wheeling = require('./image/wheeling.png');
const lotus = require('./image/lotus.png');
const sadcat = require('./image/sadcat.png');
const happycat = require('./image/happycat.png');
const balloon = require('./image/balloon.png');
const camera = require('./image/camera.png');

const announcement = require('./image/announcement.png');
const notification = require('./image/notification.png');
const event = require('./image/event.png');

const aboutus = require('./image/aboutus.gif');
const explainbutton = require('./image/explainbutton.png')

const wateron = require('./image/wateron.png')
const wateroff = require('./image/wateroff.png')


const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home"
      screenOptions={{
                headerShown: false, // 화면 제목 숨기기
              }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Banner1" component={Banner1Screen} />
        <Stack.Screen name="Banner2" component={Banner2Screen} />

        <Stack.Screen name="AboutUs" component={AboutUsScreen} />
        <Stack.Screen name="Announcement" component={AnnouncementScreen} />
        <Stack.Screen name="Event" component={EventScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="EmailPolicy" component={EmailPolicyScreen} />
        <Stack.Screen name="GrowPlant" component={GrowPlantScreen} />
        <Stack.Screen name="EditorPick" component={EditorPickScreen} />
        <Stack.Screen name="MyFriend" component={MyFriendScreen} />
        <Stack.Screen name="AroundPeople" component={AroundPeopleScreen} />
        <Stack.Screen name="ShareStory" component={ShareStoryScreen} />
        <Stack.Screen name="PlantPick" component={PlantPickScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;


