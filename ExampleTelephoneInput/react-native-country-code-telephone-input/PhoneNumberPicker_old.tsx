import { AsYouType } from "libphonenumber-js"
import React from "react"
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import DeviceInfo from "react-native-device-info"
import RNLanguages from "react-native-languages"
import Toast from "react-native-simple-toast"

import { COUNTRY_NAMES } from "../../../../i18n/countries"
import { translate } from "../../../../i18n/translate"
/* maps callingCode -> CCA2        */
import CallingCodeToCCA2 from "./calling-code-metadata.json"
/* maps CCA2 -> CountryLocalDetails */
import COUNTRY_DATA from "./country-data.json"
/* maps  CCA2 ->  callingCode      */
import CallingCodes from "../CountryPicker/data/countries.json"
import CountryPicker from "../CountryPicker/src/CountryPicker"
const downArrow = require("../../../../theme/images/ico_arrow_down.png")

const deviceLanguage: string = RNLanguages.language.slice(0, 2).toLowerCase()
const deviceCountry: string = DeviceInfo.getDeviceCountry().toLowerCase()

interface Country {
  cca2: string
  currency?: string
  callingCode?: string
  flag?: string
  name: string
}

interface Styles {
  containerCol: ViewStyle
  containerRow: ViewStyle
  viewBottomBorder: ViewStyle
  TextInputPhoneNumber: TextStyle
  TextCountryName: TextStyle
}

interface PhoneNumberPickerProps {
  onChange: (country: Country, callingCode: string, phoneNumber: string) => void
}

interface PhoneNumberPickerState {
  phoneNo: string
  callingCode: string
  country: Country
  onChange: (country: Country, callingCode: string, phoneNumber: string) => void
  skipFormatAsYouType: false
  cca2: string
  previousToast: string
}
const getCallingCode = (): string => {
  const cca2 = DeviceInfo.getDeviceCountry()
  return CallingCodes[cca2].callingCode
}
const getInitialCountry = (): Country => {
  let name
  const cca2 = DeviceInfo.getDeviceCountry()
  const callingCode = CallingCodes[cca2].callingCode
  try {
    name = COUNTRY_NAMES[deviceLanguage].countries[deviceCountry]
  } catch (error) {
    console.warn(
      `PhoneNumberPicker.tsx - getInitialCountry - ${deviceCountry} translation doesn't exist: fallback to English`,
    )
    console.tron.log(
      `PhoneNumberPicker.tsx - getInitialCountry - ${deviceCountry} translation doesn't exist: fallback to English`,
    )
    name = COUNTRY_NAMES.en.countries[deviceCountry]
  }
  return { name, cca2, callingCode }
}

class PhoneNumberPicker extends React.Component<PhoneNumberPickerProps, PhoneNumberPickerState> {
  constructor(props) {
    super(props)
    this.state = {
      phoneNo: "",
      callingCode: getCallingCode(),
      country: getInitialCountry(),
      onChange: props.onChange,
      skipFormatAsYouType: false,
      cca2: DeviceInfo.getDeviceCountry(),
      previousToast: "",
    }
  }

  textInputPhoneNumber
  countryPicker

  numberChanged = (country: Country, callingCode: string, phoneNumber: string): void => {
    callingCode = callingCode + ""
    phoneNumber = phoneNumber + ""
    callingCode = callingCode.replace(/\D/g, "")
    phoneNumber = phoneNumber.replace(/\D/g, "")
    this.state.onChange(country, callingCode, phoneNumber)
  }

  getCountryFromCCA2(cca2: string): Country {
    let countryName = ""
    let callingCode = ""

    do {
      if (cca2.length > 2) {
        cca2 = ""
        break
      }

      for (let i = 0; i < COUNTRY_DATA.length; i++) {
        if (COUNTRY_DATA[i].code.toUpperCase() == cca2.toUpperCase()) {
          try {
            countryName = COUNTRY_NAMES[deviceLanguage].countries[cca2]
          } catch (error) {
            console.warn(
              `PhoneNumberPicker.tsx - getCountryFromCCA2 - ${cca2} translation doesn't exist: fallback to English`,
            )
            console.tron.log(
              `PhoneNumberPicker.tsx - getCountryFromCCA2 - ${cca2} translation doesn't exist: fallback to English`,
            )
            countryName = COUNTRY_NAMES.en.countries[cca2]
          }
          callingCode = COUNTRY_DATA[i].dial_code
          break
        }
      }
    } while (0)

    /* both the name an cc2 should be resoled or none */
    if (countryName.length == 0 || cca2.length == 0 || callingCode.length == 0) {
      countryName =
        this.state.callingCode.length > 0
          ? translate("welcome.alert.invalidCountryCode")
          : translate("welcome.alert.chooseACountry")
      /* reset calling code as countryPicker cannot handle invalid cca2 */
      cca2 = ""
      callingCode = ""
    }

    // if the country has changed -> show toast
    // this only fires if the option is `choose a country`
    if (countryName !== this.state.previousToast) {
      Toast.show(countryName, Toast.SHORT)
    }
    return {
      name: countryName,
      cca2: cca2,
      callingCode: callingCode,
    }
  }

  getCountryFromCallingCode = (callingCode: string, phoneNumber: string): Country => {
    let cca2 = ""
    let countryName = ""
    if (!callingCode) {
      callingCode = ""
    }

    callingCode = callingCode.replace(/\D/g, "")
    phoneNumber = phoneNumber.replace(/\D/g, "")

    do {
      if (callingCode.length > 4) {
        callingCode = callingCode.slice(0, 4)
        break
      }

      if (
        CallingCodeToCCA2.country_calling_codes[callingCode] &&
        CallingCodeToCCA2.country_calling_codes[callingCode][0]
      ) {
        cca2 = CallingCodeToCCA2.country_calling_codes[callingCode][0]
      }

      let formatter = new AsYouType()
      /* may be a multi nation code as AS +1684 or +1242 bahamas try the formatter instead */
      if (cca2.length == 0) {
        formatter.input("+" + callingCode)
        if (formatter.country !== undefined && formatter.country.length == 2) {
          cca2 = formatter.country
        }
      }

      if (cca2.length) {
        for (let i = 0; i < COUNTRY_DATA.length; i++) {
          if (COUNTRY_DATA[i].code.toUpperCase() == cca2.toUpperCase()) {
            try {
              countryName = COUNTRY_NAMES[deviceLanguage].countries[cca2.toUpperCase()]
            } catch (error) {
              console.warn(
                `PhoneNumberPicker.tsx - getCountryFromCallingCode - ${cca2} translation doesn't exist: fallback to English`,
              )
              console.tron.log(
                `PhoneNumberPicker.tsx - getCountryFromCallingCode - ${cca2} translation doesn't exist: fallback to English`,
              )
              countryName = COUNTRY_NAMES.en.countries[cca2.toUpperCase()]
            }
            callingCode = COUNTRY_DATA[i].dial_code.replace(/\D/g, "")
            break
          }
        }
      }
    } while (0)

    /* if the country cannot be found / is invalid */
    if (countryName.length == 0 || cca2.length == 0) {
      countryName =
        this.state.callingCode.length > 0
          ? translate("welcome.alert.invalidCountryCode")
          : translate("welcome.alert.chooseACountry")
      cca2 = ""
    }

    return {
      name: countryName,
      cca2: cca2,
      callingCode: callingCode,
    }
  }

  FlagPickedChanged = (updatedCountry: Country): void => {
    if (updatedCountry === undefined) {
      return
    }
    // to give the modal enough time to close before showing
    setTimeout(() => {
      Toast.show(updatedCountry.name, Toast.SHORT)
    }, 300)
    // to deal with countries with no callingCode (Antarctica -> undefined)
    if (!updatedCountry.callingCode) {
      updatedCountry.callingCode = ""
    }
    const { cca2 } = updatedCountry
    this.setState({
      country: updatedCountry,
      callingCode: updatedCountry.callingCode,
      cca2,
      previousToast: updatedCountry.name,
    })
    this.numberChanged(updatedCountry, updatedCountry.callingCode, this.state.phoneNo)
    this.textInputPhoneNumber.focus()
  }

  CallingCodeChanged(updatedCallingCode: string) {
    // to remove the `+` symbol
    updatedCallingCode = updatedCallingCode.replace(/\D/g, "")
    const countryFromCallingCode: Country = this.getCountryFromCallingCode(
      updatedCallingCode,
      this.state.phoneNo,
    )
    // if the country has changed -> show toast
    if (
      countryFromCallingCode.cca2 !== this.state.country.cca2 ||
      countryFromCallingCode.name !== this.state.previousToast
    ) {
      Toast.show(countryFromCallingCode.name, Toast.SHORT)
    }
    this.setState({
      country: countryFromCallingCode,
      callingCode: updatedCallingCode,
      previousToast: countryFromCallingCode.name,
    })
    this.numberChanged(
      countryFromCallingCode,
      countryFromCallingCode.callingCode,
      this.state.phoneNo,
    )
  }

  PhoneChanged(updatedPhoneNo) {
    updatedPhoneNo = updatedPhoneNo.replace(/\D/g, "")
    /*
         * updated state and new state is the same, so this callback
         * must be due to a result of formatting character removal
         * Stop auto formatting for the next render otherwise we will
         * loop as (412) backspace (412 - will be rerendered as (412)
         * by formatter as_you_type()
         */
    let skipFormatAsYouType = updatedPhoneNo == this.state.phoneNo
    /* Also skip format as user is deleting */
    skipFormatAsYouType |= updatedPhoneNo.length < this.state.phoneNo.length
    this.setState({ skipFormatAsYouType: skipFormatAsYouType })
    this.setState({ phoneNo: updatedPhoneNo })

    this.numberChanged(this.state.country, this.state.country.callingCode, updatedPhoneNo)
  }

  componentDidMount() {
    setTimeout(() => {
      this.textInputPhoneNumber.focus()
    }, 100)
  }

  SafeRenderCountryPicker(cca2) {
    /*
    * don't render flag for a invalid cca2, this can be passed
    * via props or can dynamically get updated when calling code
    * changes
    */
    let countryFromCCA2 = this.getCountryFromCCA2(cca2)

    const countryPicker = (
      <View style={[styles.containerRow, styles.viewBottomBorder]}>
        <TouchableOpacity
          style={[styles.containerRow]}
          onPress={() => this.countryPicker.openModal()}
        >
          <CountryPicker
            ref={countryPicker => (this.countryPicker = countryPicker)}
            closeable
            onChange={this.FlagPickedChanged.bind(this)}
            cca2={countryFromCCA2.cca2}
            showCallingCode
            filterable
            autoFocusFilter={false}
          />
          <Text style={styles.TextCountryName}> {countryFromCCA2.name} </Text>
          <Image style={{ width: 20, height: 20 }} source={downArrow} />
        </TouchableOpacity>
      </View>
    )
    return countryPicker
  }

  PhoneNumberFormatAsYouType() {
    if (this.state.skipFormatAsYouType) {
      return this.state.phoneNo
    }
    // AsYouType's CountryCode type are strings -> you can ignore this [ts] lint error
    return new AsYouType(this.state.country.cca2).input(this.state.phoneNo)
  }

  render() {
    return (
      <View style={styles.containerCol}>
        {this.SafeRenderCountryPicker(this.state.country.cca2)}
        <View style={styles.containerRow}>
          <View style={[styles.containerRow, styles.viewBottomBorder]}>
            <TextInput
              style={[styles.TextInputPhoneNumber, { flex: 3, borderBottomWidth: 2 }]}
              underlineColorAndroid="transparent"
              onChangeText={this.CallingCodeChanged.bind(this)}
              value={"+" + this.state.callingCode}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.TextInputPhoneNumber, { flex: 1 }]}
              underlineColorAndroid="transparent"
              editable={false}
              value={"-"}
            />

            <TextInput
              style={[styles.TextInputPhoneNumber, { flex: 8, borderBottomWidth: 2 }]}
              ref={textInputPhoneNumber => (this.textInputPhoneNumber = textInputPhoneNumber)}
              underlineColorAndroid="transparent"
              onChangeText={this.PhoneChanged.bind(this)}
              placeholder=" Enter your phone number"
              value={this.PhoneNumberFormatAsYouType()}
              autoFocus={true}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>
    )
  }
}

export default PhoneNumberPicker

const styles = StyleSheet.create<Styles>({
  containerCol: {
    flexDirection: "column",
    marginVertical: 8,
    marginHorizontal: 8,
  },

  containerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  viewBottomBorder: {
    marginHorizontal: 30,
    borderBottomColor: "black",
    borderBottomWidth: 1,
  },

  TextInputPhoneNumber: {
    fontSize: 20,
    height: 60,
    alignItems: "center",
  },

  TextCountryName: {
    fontSize: 20,
    color: "#5890FF",
  },
})
