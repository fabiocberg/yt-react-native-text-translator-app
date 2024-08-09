import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";

// type IndexProps = {}

export default function Index() {
    const cameraRef = useRef<CameraView | null>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [state, setState] = useState<"home" | "camera">("home");
    const [processing, setProcessing] = useState<
        "none" | "detecting" | "translating"
    >("none");
    const [translatedText, setTranslatedText] = useState<string>("");

    if (!permission) {
        return null;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.containerPermission}>
                    <Text style={styles.message}>
                        O app precisa de permissão para usar a camera
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permissionButtonText}>
                            Permitir
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
            });
            if (photo && photo.base64) {
                const text = await detectText(photo.base64);
                const translation = await translateText(text);
                setTranslatedText(translation);
            }
        }
    };

    const detectText = async (base64: string): Promise<string> => {
        setState("home");
        setProcessing("detecting");
        const apiKey = "AIzaSyAVzjgCo_xf-byjsqxj2dN5q3ACejGr-xs";
        const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

        try {
            const response = await axios.post(url, {
                requests: [
                    {
                        image: {
                            content: base64,
                        },
                        features: [
                            {
                                type: "TEXT_DETECTION",
                            },
                        ],
                    },
                ],
            });
            const textAnnotations = response.data.responses[0].textAnnotations;
            return textAnnotations[0].description
                .replace(/\n/g, " ")
                .replace(/ /g, " ");
        } catch (error) {
            console.error(error);
            return "";
        }
    };

    const translateText = async (text: string): Promise<string> => {
        if (!text || text.length === 0) {
            return "";
        }
        setProcessing("translating");
        console.log(text);
        const apiKey = "AIzaSyAVzjgCo_xf-byjsqxj2dN5q3ACejGr-xs";
        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

        try {
            const response = await axios.post(url, {
                q: text,
                target: "pt",
            });

            return response.data.data.translations[0].translatedText;
        } catch (error) {
            console.error(error);
            return "";
        } finally {
            setProcessing("none");
        }
    };

    return (
        <View style={styles.container}>
            {state === "home" ? (
                <View style={styles.textTranslatedContainer}>
                    <View style={styles.captureButtonContainer}>
                        {processing === "none" ? (
                            <TouchableOpacity
                                style={styles.captureButton}
                                onPress={() => setState("camera")}
                            >
                                <Text style={styles.captureButtonText}>
                                    Capturar
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <ActivityIndicator size="large" color="#0000ff" />
                        )}
                    </View>
                    <Text style={styles.labelTranslated}>Texto traduzido:</Text>
                    <Text style={styles.textTranslated}>{translatedText}</Text>
                </View>
            ) : (
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={"back"}
                >
                    <View style={styles.cameraButtonContainer}>
                        <TouchableOpacity
                            style={styles.cameraButton}
                            onPress={takePicture}
                        >
                            <Text style={styles.cameraButtonText}>
                                Capturar
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cameraButtonCancel}
                            onPress={() => setState("home")}
                        >
                            <Text style={styles.cameraButtonTextCancel}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </CameraView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    containerPermission: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    message: {
        textAlign: "center",
        fontSize: 22,
        paddingBottom: 10,
        color: "white",
    },
    camera: {
        height: "100%",
    },
    cameraButtonContainer: {
        flex: 1,
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "160%",
        gap: 10,
    },
    cameraButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        padding: 10,
        elevation: 16,
        shadowColor: "black",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        borderWidth: 4,
        borderColor: "#000",
    },
    cameraButtonText: {
        fontSize: 18,
        color: "black",
        fontWeight: "bold",
    },
    cameraButtonCancel: {
        width: 120,
        height: 60,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ff000055",
        padding: 10,
        elevation: 16,
        shadowColor: "black",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        borderWidth: 4,
        borderColor: "#000",
    },
    cameraButtonTextCancel: {
        fontSize: 18,
        color: "white",
        fontWeight: "bold",
    },
    permissionButton: {
        paddingHorizontal: 30,
        paddingVertical: 20,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#293dd4",
        padding: 10,
    },
    permissionButtonText: {
        fontSize: 18,
        color: "white",
        fontWeight: "bold",
    },

    captureButtonContainer: {
        width: "100%",
        alignItems: "center",
        marginBottom: 16,
    },
    captureButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 8,
        backgroundColor: "blue",
    },
    captureButtonText: {
        fontSize: 18,
        color: "white",
        fontWeight: "bold",
    },
    textTranslatedContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start",
        marginHorizontal: 24,
    },
    labelTranslated: {
        fontWeight: "bold",
        fontSize: 22,
    },
    textTranslated: {
        fontSize: 22,
    },
});
